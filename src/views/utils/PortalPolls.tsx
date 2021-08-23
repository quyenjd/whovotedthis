import {
    Select,
    MenuItem,
    Divider,
    FormControl,
    Typography,
    withStyles,
    Container,
    Button
} from '@material-ui/core';
import { Component } from 'react';
import { runSnackbar } from '../../utils/Snackbar';
import Poll, { PollFilter } from '../../utils/Poll';
import PortalPollList from './PortalPollList';
import Profile from '../../utils/Profile';

const MyFormControl = withStyles((theme) => ({
    root: {
        marginRight: theme.spacing(1)
    }
}))(FormControl);

const MyContainer = withStyles((theme) => ({
    root: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    }
}))(Container);

const MySelect = withStyles((theme) => ({
    root: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1)
    }
}))(Select);

interface State {
    filter: PollFilter;
    flag: boolean;
    pollButtonDisabled: boolean;
    pollButtonContent: string;
    polls: string[];
}

/**
 * Interface element for everything about polls.
 *
 * It acts as a wrapper for `PortalPollList`, as well as handles filtering and poll creating.
 */
export default class PortalPolls extends Component<
    Record<never, never>,
    State
> {
    constructor(props: Record<never, never>) {
        super(props);

        this.state = {
            filter: 'all',
            flag: false,
            pollButtonDisabled: false,
            pollButtonContent: 'Create Poll',
            polls: []
        };
    }

    createPoll() {
        runSnackbar(true, 'Creating a new poll...', 0);
        this.setState({
            pollButtonDisabled: true,
            pollButtonContent: 'Creating'
        });
        let flag = this.state.flag;
        Poll.addPoll()
            .then(
                () => {
                    runSnackbar(true, 'A poll has been added.');
                    flag = !flag;
                },
                (error) => {
                    runSnackbar(true, error.message);
                }
            )
            .finally(() => {
                this.setState({
                    flag,
                    pollButtonDisabled: false,
                    pollButtonContent: 'Create Poll'
                });
            });
    }

    render() {
        return (
            <>
                <MyContainer style={{ display: 'flex', alignItems: 'center' }}>
                    <MyFormControl>
                        <Typography variant="body1">Viewing:</Typography>
                    </MyFormControl>
                    <FormControl variant="outlined">
                        <MySelect
                            value={this.state.filter}
                            onChange={(event) => {
                                this.setState({
                                    filter: event.target
                                        .value as State['filter']
                                });
                            }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="voting">Voting</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </MySelect>
                    </FormControl>
                    {Profile.require('poll:add')
                        ? (
                            <div style={{ flexGrow: 1, textAlign: 'right' }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => this.createPoll()}
                                    disabled={this.state.pollButtonDisabled}
                                >
                                    {this.state.pollButtonContent}
                                </Button>
                            </div>
                        )
                        : (
                            <></>
                        )}
                </MyContainer>
                <Divider />
                <MyContainer>
                    <PortalPollList
                        filter={this.state.filter}
                        flag={this.state.flag}
                    />
                </MyContainer>
            </>
        );
    }
}
