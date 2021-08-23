import { Component } from 'react';
import Poll, { PollFilter } from '../../utils/Poll';
import PortalPollListItem from './PortalPollListItem';
import { runSnackbar } from '../../utils/Snackbar';
import { Typography } from '@material-ui/core';

interface Props {
    filter: PollFilter;
    flag: boolean;
}

interface State {
    loaded: boolean;
    polls: Poll[];
}

/**
 * Accordion list to show all polls.
 *
 * It acts as a wrapper to map `PortalPollListItem` elements.
 */
export default class PortalPollList extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            loaded: false,
            polls: []
        };
    }

    componentDidMount(reload = true) {
        this.setState({
            loaded: false
        });

        (reload ? Poll.loadPolls() : Promise.resolve()).then(
            () => {
                Poll.getPolls().then((polls) => {
                    Promise.all(
                        polls.map((pollId) =>
                            Poll.getPoll(pollId).then((poll) =>
                                poll.getStage().then((stage) => [poll, stage])
                            )
                        )
                    ).then((stages) => {
                        this.setState({
                            loaded: true,
                            polls: stages
                                .filter(
                                    ([poll, stage]) =>
                                        this.props.filter === 'all' ||
                                        this.props.filter === stage
                                )
                                .map(([poll, stage]) => poll as Poll)
                        });
                    });
                });
            },
            (error) => {
                runSnackbar(true, error.message);
                this.setState({
                    loaded: true,
                    polls: []
                });
            }
        );
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.flag !== this.props.flag) this.componentDidMount(true);
        else if (prevProps.filter !== this.props.filter) { this.componentDidMount(false); }
    }

    render() {
        if (!this.state.loaded) { return <Typography variant="body2">Loading...</Typography>; }

        const pollItems = this.state.polls.map((poll, index) => {
            return (
                <PortalPollListItem
                    poll={poll}
                    key={index}
                    refresher={() => this.componentDidMount()}
                />
            );
        });

        return pollItems.length
            ? (
                pollItems
            )
            : (
                <Typography variant="body2">No polls found.</Typography>
            );
    }
}
