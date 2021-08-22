import { Component } from 'react';
import { DialogContentText, MenuItem } from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';

/**
 * Interface element for joining the poll.
 *
 * By joining, I mean call `Poll.voteOptions` and pass random rates to all options before
 * letting users upvote/downvote them.
 *
 * This is to make sure once a user joins a poll, he/she has a vote in all options.
 */
export default class PollMenuJoin extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        return (
            <MenuItem
                onClick={() => {
                    this.props.close();
                    runDialog({
                        open: true,
                        title: 'Join Poll',
                        content: (
                            <DialogContentText>
                                Are you sure you want to join the poll and start
                                voting?
                            </DialogContentText>
                        ),
                        onProceed: () => {
                            runSnackbar(true, 'Joining poll...', 0);

                            const rates = {} as { [id: string]: number };
                            this.props.options.forEach((option, index) => {
                                rates[option.id] = index + 1;
                            });

                            this.props.poll.voteOptions(rates).then(
                                () => {
                                    runDialog({
                                        open: false
                                    });
                                    runSnackbar(
                                        true,
                                        'You have joined the poll.'
                                    );
                                    this.props.itemRefresher();
                                },
                                (error) => {
                                    runSnackbar(true, error.message);
                                }
                            );
                        }
                    });
                }}
            >
                Join Poll
            </MenuItem>
        );
    }
}
