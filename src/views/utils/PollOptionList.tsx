import { Component } from 'react';
import PollBodyElementProps from './PollBodyElementProps';
import {
    Container,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Paper,
    withStyles
} from '@material-ui/core';
import Profile from '../../utils/Profile';
import { PollOption as Option } from '../../utils/Poll';
import PollOption from './PollOption';
import { runSnackbar } from '../../utils/Snackbar';

const MyContainer = withStyles((theme) => ({
    root: {
        marginTop: theme.spacing(1),
        display: 'block',
        width: '100%'
    }
}))(Container);

export default class PollOptionList extends Component<PollBodyElementProps> {
    render() {
        if (!Profile.require('poll:option:view')) return <></>;

        const canVote = Profile.require('poll:vote');

        const getSorted = (options: Option[]) => {
            const indexes = [];
            for (let i = 0; i < options.length; ++i) indexes.push(i);

            return this.props.stage === 'closed'
                ? indexes.sort((x, y) => options[x].result - options[y].result)
                : canVote && this.props.voted
                    ? indexes.sort(
                        (x, y) =>
                            options[x].votes[canVote] - options[y].votes[canVote]
                    )
                    : indexes;
        };

        return (
            <MyContainer disableGutters>
                <Paper variant="outlined">
                    <List style={{ width: '100%', maxHeight: '240px' }}>
                        <ListSubheader>
                            {this.props.stage === 'open'
                                ? 'My options'
                                : this.props.stage === 'voting'
                                    ? 'All options (exluding yours)'
                                    : 'Results'}
                        </ListSubheader>
                        {this.props.stage === 'closed' || this.props.voted
                            ? (
                                getSorted(this.props.options).map(
                                    (value, index, arr) => (
                                        <PollOption
                                            {...this.props}
                                            key={index}
                                            index={value}
                                            up={
                                                index
                                                    ? () => {
                                                        const previousValue =
                                                          arr[index - 1];
                                                        runSnackbar(
                                                            true,
                                                            'Updating your vote...',
                                                            0
                                                        );
                                                        this.props.poll
                                                            .voteOptions({
                                                                [this.props
                                                                    .options[
                                                                        previousValue
                                                                    ].id]: index + 1,
                                                                [this.props
                                                                    .options[
                                                                        value
                                                                    ].id]: index
                                                            })
                                                            .then(
                                                                () => {
                                                                    runSnackbar(
                                                                        true,
                                                                        'Your vote has been updated.'
                                                                    );
                                                                    this.props.itemRefresher();
                                                                },
                                                                (error) => {
                                                                    runSnackbar(
                                                                        true,
                                                                        error.message
                                                                    );
                                                                }
                                                            );
                                                    }
                                                    : () => {}
                                            }
                                        />
                                    )
                                )
                            )
                            : (
                                <ListItem disabled>
                                    <ListItemText>
                                    Please join the poll to see and vote the
                                    options.
                                    </ListItemText>
                                </ListItem>
                            )}
                    </List>
                </Paper>
            </MyContainer>
        );
    }
}
