import axios, { AxiosResponse } from 'axios';
import { cloneDeep, isArray, isPlainObject, isString, reduce } from 'lodash';
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

/**
 * All operations related to Poll.
 */
export default class Poll {
    private static loaded: PollObject = {};
    private static _id = '';
    private static _version = 0;
    private static pollIdCounter = 0;
    private static optionIdCounter = 0;
    private static axios: Promise<void> = Promise.resolve();

    /**
     * Wait until `loadPolls` (if called) finishes.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public static afterLoaded() {
        return this.axios;
    }

    /**
     * Load all polls from the database.
     *
     * @returns A Promise that resolves when the operation is done.
     */
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

    /**
     * Add new poll to the database.
     *
     * @returns A Promise that resolves when the operation is done.
     */
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

    /**
     * Get all loaded polls.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public static getPolls() {
        return this.axios.then(() => Object.keys(this.loaded));
    }

    /**
     * Get the instance of a poll.
     *
     * @param id Id of the poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public static getPoll(id: string) {
        return this.axios.then(() =>
            Object.prototype.hasOwnProperty.call(this.loaded, id)
                ? this.loaded[id]
                : null
        );
    }

    /**
     * Remove a poll from the database.
     *
     * @param id Id of the poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public static removePoll(id: string) {
        return this.getPoll(id).then((poll) =>
            poll ? poll.remove() : Promise.resolve()
        );
    }

    /**
     * Push information of all polls to the database.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    private static save() {
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
    private limit = 0;

    private _id = '';
    private _version = 0;
    private axios: Promise<void> = Promise.resolve();

    /**
     * Initialize a poll instance.
     *
     * This is made private as I enforce the use of the static method `getPoll`.
     *
     * @param id Id of the poll.
     */
    private constructor(id: string) {
        this.pollId = id;

        const _ = (response: AxiosResponse<any>) => {
            Poll.checkResponse(response);

            this._id = response.data[0]._id;
            const data = response.data[0].data;
            this.title = data.title;
            this.stage = data.stage;
            this.options = data.options;
            this.limit = parseInt(data.limit) || 0;
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

    /**
     * Wait until the constructor finishes.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public afterLoaded() {
        return this.axios;
    }

    /**
     * Get limit of the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public getLimit() {
        return this.axios.then(() => {
            return this.limit;
        });
    }

    /**
     * Set limit of the current poll.
     *
     * @param newLimit New limit (0 means the limit is removed).
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public setLimit(newLimit: number) {
        return Profile.require('poll:limit')
            ? this.axios.then(() => {
                if (this.stage === 'open') {
                    this.limit = Math.max(0, newLimit);
                    return this.save();
                } else {
                    throw new Error(
                        'This operation is only allowed on Open polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Get title of the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public getTitle() {
        return this.axios.then(() => {
            return this.title;
        });
    }

    /**
     * Update title of the current poll.
     *
     * @param newTitle New title (if empty, fall back to using `New Poll`)
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public updateTitle(newTitle: string) {
        return Profile.require('poll:update')
            ? this.axios.then(() => {
                if (this.stage !== 'closed') {
                    this.title = newTitle || 'New Poll';
                    return this.save();
                } else {
                    throw new Error(
                        'This operation is not allowed on Closed polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Get stage of the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public getStage() {
        return this.axios.then(() => {
            return this.stage;
        });
    }

    /**
     * Update stage of the current poll.
     *
     * @param newStage New stage.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public updateStage(newStage: PollStage) {
        return Profile.require('poll:stage:change')
            ? this.axios.then(() => {
                if (this.stage === newStage) return Promise.resolve();
                if (
                    newStage === 'open' &&
                      (this.stage === 'voting' || this.stage === 'closed')
                ) {
                    return Promise.resolve();
                }
                if (newStage === 'voting' && this.stage === 'closed') {
                    return Promise.resolve();
                }

                if (newStage === 'voting' && !this.options.length) {
                    throw new Error('Cannot start voting on an empty poll');
                }

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

    /**
     * Add a new option to the current poll.
     *
     * @param value Initiating value of the option.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public addOption(value = '') {
        const username = Profile.require('poll:option:add');
        return username
            ? this.axios
                .then(() => {
                    if (this.stage === 'open') {
                        if (
                            this.limit &&
                              reduce(
                                  this.options,
                                  (count, option) =>
                                      count + +(option.user === username),
                                  0
                              ) >= this.limit
                        ) {
                            throw new Error(
                                'You have reached the limit of options'
                            );
                        }

                        this.options.push({
                            id: `${Poll.optionIdCounter++}`,
                            value: value || 'New Option',
                            user: username,
                            result: 0,
                            votes: {}
                        });
                        return this.save();
                    } else {
                        throw new Error(
                            'This operation is only allowed on Open polls'
                        );
                    }
                })
                .then(() => Poll.save())
            : Promise.resolve();
    }

    /**
     * Get all options of the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public getOptions() {
        const username =
            Profile.require('poll:option:view') ||
            (this.stage === 'closed' ? Profile.require('portal') : false);
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
                        for (const user in option.votes) {
                            if (user !== username) delete option.votes[user];
                        }
                        return option;
                    });
            })
            : Promise.resolve([] as PollOption[]);
    }

    /**
     * Get info string of the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public getInfo() {
        return (
            Profile.require('poll:viewinfo')
                ? this.axios.then(() => {
                    const added = {} as Record<string, boolean>;
                    const voted = {} as Record<string, boolean>;
                    this.options.forEach((option) => {
                        added[option.user] = true;
                        Object.keys(option.votes).forEach((username) => {
                            voted[username] = true;
                        });
                    });

                    const numAdded = Object.keys(added).length;
                    const numJoined = Object.keys(voted).length;
                    const numOptions = this.options.length;
                    return `${numAdded} voter${
                        numAdded > 1 ? 's' : ''
                    } added ${numOptions} option${
                        numOptions > 1 ? 's' : ''
                    }. ${numJoined} voter${
                        numJoined > 1 ? 's have' : ' has'
                    } joined the voting.`;
                })
                : Promise.resolve('')
        ).then((info) =>
            this.getLimit().then(
                (limit) =>
                    `${info}${info.length ? '\n' : ''}${
                        limit
                            ? `This poll is limited to a maximum of ${limit} option${
                                limit > 1 ? 's' : ''
                            } per user.`
                            : ''
                    }`
            )
        );
    }

    /**
     * Update value of an option of the current poll.
     *
     * @param id Id of the option.
     * @param newValue New value (if empty, fall back to using the old value).
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public updateOption(id: string, newValue: string) {
        const username = Profile.require('poll:option:edit');
        return username
            ? this.axios.then(() => {
                if (this.stage === 'open') {
                    this.options = this.options.map((option) => ({
                        ...option,
                        value:
                              option.id === id
                                  ? newValue || option.value
                                  : option.value
                    }));
                    return this.save();
                } else {
                    throw new Error(
                        'This operation is only allowed on Open polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Remove an option from the current poll.
     *
     * @param id Id of the option.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public removeOption(id: string) {
        const username = Profile.require('poll:option:remove');
        return username
            ? this.axios.then(() => {
                if (this.stage === 'open') {
                    this.options = this.options.filter(
                        (option) =>
                            !(option.id === id && option.user === username)
                    );
                    return this.save();
                } else {
                    throw new Error(
                        'This operation is only allowed on Open polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Vote an option of the current poll.
     *
     * @param rates An object of option ids and new rates.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public voteOptions(rates: { [id: string]: number }) {
        const username = Profile.require('poll:vote');
        return username
            ? this.axios.then(() => {
                if (this.stage === 'voting') {
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
                } else {
                    throw new Error(
                        'This operation is only allowed on Voting polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Remove the current poll.
     *
     * @returns A Promise that resolves when the operation is done.
     */
    public remove() {
        return Profile.require('poll:remove')
            ? this.axios.then(() => {
                if (this.stage !== 'closed') {
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
                } else {
                    throw new Error(
                        'This operation is not allowed on Closed polls'
                    );
                }
            })
            : Promise.resolve();
    }

    /**
     * Push information of the current poll to the database.
     *
     * @returns A Promise that resolves when the operation is done.
     */
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
                        options: this.options,
                        limit: this.limit
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

    /**
     * Check validity of the response and throw `Error` where necessary.
     *
     * @param response Response object from axios.
     */
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
        ) {
            throw new Error('Cannot parse the response from server');
        }
    }
}
