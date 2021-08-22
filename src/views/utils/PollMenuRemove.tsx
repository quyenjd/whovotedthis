import { Component } from 'react';
import { DialogContentText, MenuItem } from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';

/**
 * Interface element for `Poll.remove`.
 */
export default class PollMenuRemove extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        return (
            <MenuItem
                onClick={() => {
                    this.props.close();
                    runDialog({
                        open: true,
                        title: 'Remove Poll',
                        content: (
                            <DialogContentText>
                                Are you sure you want to remove the poll?
                            </DialogContentText>
                        ),
                        onProceed: () => {
                            runSnackbar(true, 'Removing poll...', 0);
                            this.props.poll.remove().then(
                                () => {
                                    runDialog({
                                        open: false
                                    });
                                    runSnackbar(true, 'Poll has been removed.');
                                    this.props.listRefresher();
                                },
                                (error) => {
                                    runSnackbar(true, error.message);
                                }
                            );
                        }
                    });
                }}
            >
                Remove Poll
            </MenuItem>
        );
    }
}
