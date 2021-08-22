import { Component } from 'react';
import { DialogContentText, MenuItem } from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runSnackbar } from '../../utils/Snackbar';
import { runDialog } from '../../utils/Dialog';

export default class PollMenuStage extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        const content = `Mark as ${
            this.props.stage === 'open' ? 'Voting' : 'Closed'
        }`;

        return (
            <MenuItem
                onClick={() => {
                    this.props.close();
                    runDialog({
                        open: true,
                        title: content,
                        content: (
                            <DialogContentText>
                                Are you sure you want to change the poll stage?
                                Note that you cannot switch back to the previous
                                stage once new stage is marked.
                            </DialogContentText>
                        ),
                        onProceed: () => {
                            runSnackbar(true, 'Updating poll stage...', 0);
                            this.props.poll
                                .updateStage(
                                    this.props.stage === 'open'
                                        ? 'voting'
                                        : 'closed'
                                )
                                .then(
                                    () => {
                                        runDialog({
                                            open: false
                                        });
                                        runSnackbar(
                                            true,
                                            'Poll stage has been updated.'
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
                {content}
            </MenuItem>
        );
    }
}
