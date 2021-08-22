import { Component } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Typography,
    withStyles
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Poll, { PollOption, PollStage } from '../utils/Poll';
import PollBodyElementProps from './utils/PollBodyElementProps';
import PollInfo from './utils/PollInfo';
import PollMenu from './utils/PollMenu';
import PollOptionList from './utils/PollOptionList';
import Profile from '../utils/Profile';

const MyChip = withStyles((theme) => ({
    root: {
        marginRight: theme.spacing(1)
    }
}))(Chip);

interface TitleProps {
    title: string;
    stage: PollStage;
    options: PollOption[];
    voted: boolean;
}

// Accordion title element
class PortalPollListItemTitle extends Component<TitleProps> {
    render() {
        const canVote = Profile.require('poll:vote');

        return (
            <Typography variant="body1">
                <MyChip
                    color={
                        this.props.stage === 'open'
                            ? 'default'
                            : this.props.stage === 'voting'
                                ? 'primary'
                                : 'secondary'
                    }
                    size="small"
                    label={
                        this.props.stage.charAt(0).toUpperCase() +
                        this.props.stage.slice(1).toLowerCase()
                    }
                />
                {this.props.title}
                {canVote && this.props.stage !== 'open'
                    ? ' ' + (this.props.voted ? '(joined)' : '(not joined)')
                    : ''}
            </Typography>
        );
    }
}

// Accordion body element
class PortalPollListItemBody extends Component<PollBodyElementProps> {
    render() {
        return (
            <div style={{ width: '100%' }}>
                <PollInfo {...this.props} />
                <PollOptionList {...this.props} />
                <PollMenu {...this.props} />
            </div>
        );
    }
}

interface Props {
    poll: Poll;
    refresher: () => void;
}

interface State {
    loaded: boolean;
}

/**
 * Interface element for a poll, which is an accordion list item.
 */
export default class PortalPollListItem extends Component<Props, State> {
    options: PollOption[];
    stage: PollStage;
    title: string;

    constructor(props: Props) {
        super(props);

        this.state = {
            loaded: false
        };
    }

    componentDidMount() {
        Promise.all([
            this.props.poll.getTitle(),
            this.props.poll.getStage(),
            this.props.poll.getOptions()
        ]).then(([title, stage, options]) => {
            this.title = title;
            this.stage = stage;
            this.options = options;
            this.setState({
                loaded: true
            });
        });
    }

    refresher() {
        Promise.all([
            this.props.poll.getTitle(),
            this.props.poll.getStage(),
            this.props.poll.getOptions()
        ]).then(([title, stage, options]) => {
            this.title = title;
            this.stage = stage;
            this.options = options;
            this.forceUpdate();
        });
    }

    render() {
        const canVote = Profile.require('poll:vote');

        const hasVoted = (() => {
            if (!this.options) return false;

            let voted = !!canVote;
            this.options.forEach((option) => {
                if (
                    canVote &&
                    option.user !== canVote &&
                    !Object.prototype.hasOwnProperty.call(option.votes, canVote)
                ) {
                    voted = false;
                }
            });
            return voted;
        })();

        return (
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {this.state.loaded
                        ? (
                            <PortalPollListItemTitle
                                stage={this.stage}
                                title={this.title}
                                options={this.options}
                                voted={hasVoted}
                            />
                        )
                        : (
                            <Typography variant="body1">Loading...</Typography>
                        )}
                </AccordionSummary>
                <AccordionDetails>
                    {this.state.loaded
                        ? (
                            <PortalPollListItemBody
                                poll={this.props.poll}
                                stage={this.stage}
                                options={this.options}
                                voted={hasVoted}
                                itemRefresher={() => this.refresher()}
                                listRefresher={() => this.props.refresher()}
                            />
                        )
                        : (
                            <Typography variant="body2">Loading...</Typography>
                        )}
                </AccordionDetails>
            </Accordion>
        );
    }
}
