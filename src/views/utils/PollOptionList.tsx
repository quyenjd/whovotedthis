import { Component } from 'react';
import PollBodyElementProps from './PollBodyElementProps';
import {
    Container,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Paper,
    withStyles,
    Divider
} from '@material-ui/core';
import Profile from '../../utils/Profile';
import { PollOption } from '../../utils/Poll';
import PollOptionListItem from './PollOptionListItem';
import { runSnackbar } from '../../utils/Snackbar';
import ConfigPool from '../../utils/ConfigPool';

const MyContainer = withStyles((theme) => ({
    root: {
        marginTop: theme.spacing(1),
        display: 'block',
        width: '100%'
    }
}))(Container);

/**
 * Interface element for a list of poll options.
 *
 * It acts as a wrapper to map PollOptionListItem elements and handle upvoting.
 */
export default class PollOptionList extends Component<PollBodyElementProps> {
    render() {
        if (
            this.props.stage !== 'closed' &&
            !Profile.require('poll:option:view')
        ) {
            return <></>;
        }

        const canVote = Profile.require('poll:vote');

        const getSorted = (options: PollOption[]) => {
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

        const listItems = getSorted(this.props.options).map(
            (value, index, arr) => (
                <PollOptionListItem
                    {...this.props}
                    key={index}
                    index={value}
                    rank={index + 1}
                    up={
                        index
                            ? () => {
                                const previousValue = arr[index - 1];
                                ConfigPool.set(
                                    ['PollOption', 'voting'],
                                    true
                                );
                                runSnackbar(true, 'Updating your vote...', 0);
                                this.props.poll
                                    .voteOptions({
                                        [this.props.options[previousValue]
                                            .id]: index + 1,
                                        [this.props.options[value].id]: index
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
                                            runSnackbar(true, error.message);
                                        }
                                    )
                                    .finally(() => {
                                        ConfigPool.set(
                                            ['PollOption', 'voting'],
                                            false
                                        );
                                    });
                            }
                            : () => {}
                    }
                />
            )
        );

        return (
            <MyContainer disableGutters>
                <Paper variant="outlined">
                    <List
                        style={{
                            width: '100%',
                            maxHeight: '240px',
                            overflowY: 'auto'
                        }}
                    >
                        <ListSubheader color="primary" disableSticky>
                            {this.props.stage === 'open'
                                ? 'My options'
                                : this.props.stage === 'voting'
                                    ? 'All options (exluding yours, sorted by preference)'
                                    : 'Results'}
                        </ListSubheader>
                        <Divider />
                        {this.props.stage === 'voting' && !this.props.voted
                            ? (
                                <ListItem disabled>
                                    <ListItemText secondary="Please join the poll to see and vote the options." />
                                </ListItem>
                            )
                            : listItems.length
                                ? (
                                    listItems
                                )
                                : (
                                    <ListItem disabled>
                                        <ListItemText secondary="No options found." />
                                    </ListItem>
                                )}
                    </List>
                </Paper>
            </MyContainer>
        );
    }
}
