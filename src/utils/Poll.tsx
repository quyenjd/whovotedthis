import axios, { AxiosResponse } from 'axios';
import {
    cloneDeep,
    isArray,
    isPlainObject,
    isSafeInteger,
    isString,
    reduce
} from 'lodash';
import Profile from './Profile';

export type PollStage = 'open' | 'voting' | 'closed';
export type PollFilter = 'all' | PollStage;
export interface PollOptionVote {
    [user: string]: number;
}
export interface PollOption {
    id: string;
    value: string;
    user: string;
    result: number;
    votes: PollOptionVote;
}

interface PollObject {
    [id: string]: Poll;
}

export default class Poll {
    private static loaded: PollObject = {};
    private static _id = '';
    private static _version = 0;
    private static pollIdCounter = 0;
    private static optionIdCounter = 0;
    private static axios: Promise<void> = Promise.resolve();

    public static afterLoaded() {
        return this.axios;
    }

    public static loadPolls() {
        const _ = (response: AxiosResponse<any>) => {
            this.checkResponse(response);

            this._id = response.data[0]._id;
            const data = response.data[0].data;
            this.loaded = {};
            data.polls.forEach((id: string) => {
                this.loaded[id] = new Poll(id);
            });
            this.pollIdCounter = parseInt(data.pollIdCounter) || 0;
            this.optionIdCounter = parseInt(data.optionIdCounter) || 0;
        };
        return (this.axios = axios
            .get('/~/build/open/POLLS?all=true')
            .then((response) => {
                _(response);
            })
            .catch(() =>
                axios
                    .post('/~/build/open/POLLS', {
                        polls: [],
                        pollIdCounter: 0,
                        optionIdCounter: 0
                    })
                    .then((response) => {
                        _({
                            ...response,
                            data: [response.data]
                        });
                    })
            )).then(() => {
            return axios
                .get('/~/build/open/POLLS_VERSION?all=true')
                .then((response) => {
                    try {
                        this._version =
                            parseInt(response.data[0].data.version) || 0;
                    } catch (e) {
                        this._version = 0;
                    }
                });
        });
    }

    public static addPoll() {
        return Profile.require('poll:add')
            ? this.axios.then(() => {
                const newId = `${this.pollIdCounter++}`;
                this.loaded[newId] = new Poll(newId);
                return this.loaded[newId]
                    .afterLoaded()
                    .then(() => this.save().then(() => newId));
            })
            : Promise.resolve('');
    }

    public static getPolls() {
        return this.axios.then(() => Object.keys(this.loaded));
    }

    public static getPoll(id: string) {
        return this.axios.then(() =>
            Object.prototype.hasOwnProperty.call(this.loaded, id)
                ? this.loaded[id]
                : null
        );
    }

    public static removePoll(id: string) {
        return this.getPoll(id).then((poll) =>
            poll ? poll.remove() : Promise.resolve()
        );
    }

    public static save() {
        let success: string | null;

        return axios
            .get('/~/build/open/POLLS_VERSION?all=true')
            .then((response) => {
                let version = 0;

                try {
                    version = parseInt(response.data[0].data.version) || 0;
                    success = response.data[0]._id;
                } catch (e) {
                    version = 0;
                    success = null;
                }

                if (this._version !== version) {
                    throw new Error(
                        'Please refresh the portal before making any further changes'
                    );
                }
            })
            .then(() => {
                return axios.request({
                    url: '/~/build/open/POLLS',
                    method: 'PATCH',
                    data: {
                        id: this._id,
                        polls: Object.keys(this.loaded),
                        pollIdCounter: this.pollIdCounter,
                        optionIdCounter: this.optionIdCounter
                    }
                });
            })
            .then(() => {
                return (
                    success
                        ? axios.request({
                            url: '/~/build/open/POLLS_VERSION',
                            method: 'PATCH',
                            data: {
                                id: success,
                                version: this._version + 1
                            }
                        })
                        : axios.post('/~/build/open/POLLS_VERSION', {
                            version: this._version + 1
                        })
                ).then(() => {
                    ++this._version;
                });
            });
    }

    private pollId = '';
    private title = '';
    private stage: PollStage = 'open';
    private options: PollOption[] = [];

    private _id = '';
    private _version = 0;
    private axios: Promise<void> = Promise.resolve();

    private constructor(id: string) {
        this.pollId = id;

        const _ = (response: AxiosResponse<any>) => {
            Poll.checkResponse(response);

            this._id = response.data[0]._id;
            const data = response.data[0].data;
            this.title = data.title;
            this.stage = data.stage;
            this.options = data.options;
        };

        this.axios = axios
            .get(`/~/build/open/POLLS_${this.pollId}?all=true`)
            .then((response) => {
                _(response);
            })
            .catch(() => {
                return axios
                    .post(`/~/build/open/POLLS_${this.pollId}`, {
                        title: 'New Poll',
                        stage: 'open',
                        options: []
                    })
                    .then((response) => {
                        _({
                            ...response,
                            data: [response.data]
                        });
                    });
            })
            .then(() => {
                return axios
                    .get(`/~/build/open/POLLS_${this.pollId}_VERSION?all=true`)
                    .then((response) => {
                        try {
                            this._version =
                                parseInt(response.data[0].data.version) || 0;
                        } catch (e) {
                            this._version = 0;
                        }
                    });
            });
    }

    public afterLoaded() {
        return this.axios;
    }

    public getTitle() {
        return this.axios.then(() => {
            return this.title;
        });
    }

    public updateTitle(newTitle: string) {
        return Profile.require('poll:update')
            ? this.axios.then(() => {
                this.title = newTitle || 'New Poll';
                return this.save();
            })
            : Promise.resolve();
    }

    public getStage() {
        return this.axios.then(() => {
            return this.stage;
        });
    }

    public updateStage(newStage: PollStage) {
        return Profile.require('poll:stage:change')
            ? this.axios.then(() => {
                if (this.stage === newStage) return Promise.resolve();
                if (
                    newStage === 'open' &&
                      (this.stage === 'voting' || this.stage === 'closed')
                ) { return Promise.resolve(); }
                if (newStage === 'voting' && this.stage === 'closed') { return Promise.resolve(); }

                if (newStage === 'voting' && !this.options.length) { throw new Error('Cannot start voting on an empty poll'); }

                // Calculate the result if the poll is switched to Closed
                if (newStage === 'closed') {
                    this.options.forEach((option) => {
                        const rates = Object.values(option.votes);
                        option.result = rates.length
                            ? reduce(
                                rates,
                                (total, rate) => total + rate,
                                0.0
                            ) / rates.length
                            : 0;
                    });
                }

                this.stage = newStage;
                return this.save();
            })
            : Promise.resolve();
    }

    public addOption(value = '') {
        const username =
            this.stage === 'open' ? Profile.require('poll:option:add') : false;
        return username
            ? this.axios
                .then(() => {
                    this.options.push({
                        id: `${Poll.optionIdCounter++}`,
                        value: value || 'New Option',
                        user: username,
                        result: 0,
                        votes: {}
                    });
                    return this.save();
                })
                .then(() => Poll.save())
            : Promise.resolve();
    }

    public getOptions() {
        const username = Profile.require('poll:option:view');
        return username
            ? this.axios.then(() => {
                return cloneDeep(this.options)
                    .filter((option) => {
                        return this.stage === 'open'
                            ? option.user === username
                            : this.stage === 'voting'
                                ? option.user !== username
                                : true;
                    })
                    .map((option) => {
                        for (const user in option.votes) { if (user !== username) delete option.votes[user]; }
                        return option;
                    });
            })
            : Promise.resolve([] as PollOption[]);
    }

    public getInfo() {
        return Profile.require('poll:viewinfo')
            ? this.axios.then(() => {
                const dict = {} as Record<string, boolean>;
                this.options.forEach((option) => {
                    dict[option.user] = true;
                });

                const numVoters = Object.keys(dict).length;
                const numOptions = this.options.length;
                return `${numVoters} voter${
                    numVoters > 1 ? 's' : ''
                } joined, ${numOptions} option${
                    numOptions > 1 ? 's' : ''
                } added.`;
            })
            : Promise.resolve('');
    }

    public updateOption(id: string, newValue: string) {
        const username =
            this.stage === 'open' ? Profile.require('poll:option:edit') : false;
        return username
            ? this.axios.then(() => {
                this.options = this.options.map((option) => ({
                    ...option,
                    value:
                          option.id === id
                              ? newValue || option.value
                              : option.value
                }));
                return this.save();
            })
            : Promise.resolve();
    }

    public removeOption(id: string) {
        const username =
            this.stage === 'open'
                ? Profile.require('poll:option:remove')
                : false;
        return username
            ? this.axios.then(() => {
                this.options = this.options.filter(
                    (option) =>
                        !(option.id === id && option.user === username)
                );
                return this.save();
            })
            : Promise.resolve();
    }

    public voteOptions(rates: { [id: string]: number }) {
        const username =
            this.stage === 'voting' ? Profile.require('poll:vote') : false;
        return username
            ? this.axios.then(() => {
                this.options = this.options.map((option) => {
                    return Object.prototype.hasOwnProperty.call(
                        rates,
                        option.id
                    ) && option.user !== username
                        ? {
                            ...option,
                            votes: {
                                ...option.votes,
                                [username]: rates[option.id]
                            }
                        }
                        : option;
                });
                return this.save();
            })
            : Promise.resolve();
    }

    public remove() {
        return Profile.require('poll:remove')
            ? this.getStage().then((stage) => {
                if (stage === 'closed') return Promise.resolve();
                return axios
                    .request({
                        url: `/~/build/open/POLLS_${this.pollId}`,
                        method: 'DELETE',
                        data: { id: this._id }
                    })
                    .then(() => {
                        delete Poll.loaded[this.pollId];
                        return Poll.save();
                    });
            })
            : Promise.resolve();
    }

    private save() {
        let success: string | null;

        return axios
            .get(`/~/build/open/POLLS_${this.pollId}_VERSION?all=true`)
            .then((response) => {
                let version = 0;

                try {
                    version = parseInt(response.data[0].data.version) || 0;
                    success = response.data[0]._id;
                } catch (e) {
                    version = 0;
                    success = null;
                }

                if (this._version !== version) {
                    throw new Error(
                        'Please refresh the portal before making any further changes'
                    );
                }
            })
            .then(() => {
                return axios.request({
                    url: `/~/build/open/POLLS_${this.pollId}`,
                    method: 'PATCH',
                    data: {
                        id: this._id,
                        title: this.title,
                        stage: this.stage,
                        options: this.options
                    }
                });
            })
            .then(() => {
                return (
                    success
                        ? axios.request({
                            url: `/~/build/open/POLLS_${this.pollId}_VERSION`,
                            method: 'PATCH',
                            data: {
                                id: success,
                                version: this._version + 1
                            }
                        })
                        : axios.post(
                            `/~/build/open/POLLS_${this.pollId}_VERSION`,
                            { version: this._version + 1 }
                        )
                ).then(() => {
                    ++this._version;
                });
            });
    }

    private static checkResponse(response: AxiosResponse<any>) {
        if (Object.prototype.hasOwnProperty.call(response.data, 'error')) {
            throw new Error(response.data.error);
        }
        if (
            !(
                isArray(response.data) &&
                response.data.length &&
                isPlainObject(response.data[0]) &&
                isString(response.data[0]._id) &&
                isPlainObject(response.data[0].data)
            )
        ) { throw new Error('Cannot parse the response from server'); }
    }
}
