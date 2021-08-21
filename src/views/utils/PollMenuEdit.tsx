import { Component, useState } from 'react';
import { MenuItem, TextField } from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';

let newTitle = '';

const Form = function ({
    originalTitle,
    proceed
}: {
    originalTitle: string;
    proceed: () => void;
}) {
    const [title, setTitle] = useState(originalTitle);
    newTitle = title;

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                proceed();
            }}
        >
            <TextField
                autoFocus
                margin="dense"
                label="New Title"
                fullWidth
                value={title}
                required
                onChange={(event) => {
                    setTitle(event.target.value);
                }}
            />
        </form>
    );
};

export default class PollMenuEdit extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        const proceed = () => {
            runSnackbar(true, 'Updating poll title...', 0);
            this.props.poll.updateTitle(newTitle).then(
                () => {
                    runDialog({
                        open: false
                    });
                    runSnackbar(true, 'Poll title has been updated.');
                    this.props.itemRefresher();
                },
                (error) => {
                    runSnackbar(true, error.message);
                }
            );
        };

        return (
            <MenuItem
                onClick={() => {
                    this.props.close();
                    this.props.poll.getTitle().then((title) => {
                        runDialog({
                            open: true,
                            title: 'Rename Poll',
                            content: (
                                <Form originalTitle={title} proceed={proceed} />
                            ),
                            onProceed: () => {
                                proceed();
                            }
                        });
                    });
                }}
            >
                Rename Poll
            </MenuItem>
        );
    }
}
