import { Component, useState } from 'react';
import {
    FormControlLabel,
    FormGroup,
    MenuItem,
    TextField,
    Checkbox
} from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';

let newLimit = 0;

// Form element to handle `change` state of fields
const Form = function ({ originalLimit }: { originalLimit: number }) {
    const [limitMode, setLimitMode] = useState(originalLimit > 0);
    const [limit, setLimit] = useState(originalLimit);

    const nLimit = Math.max(1, limit);
    newLimit = limitMode ? nLimit : 0;

    return (
        <FormGroup row>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={limitMode}
                        onChange={(event) => {
                            setLimitMode(event.target.checked);
                        }}
                    />
                }
                label="Enable limit"
            />
            <TextField
                disabled={!limitMode}
                autoFocus
                fullWidth
                margin="dense"
                value={nLimit}
                type="number"
                variant="outlined"
                label="Maximum number of options"
                helperText="This will not affect options that were added."
                onChange={(event) => {
                    setLimit(parseInt(event.target.value) || 1);
                }}
            />
        </FormGroup>
    );
};

/**
 * Interface element for `Poll.setLimit`.
 */
export default class PollMenuLimit extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        const proceed = () => {
            runSnackbar(true, 'Updating poll limit...', 0);
            this.props.poll.setLimit(newLimit).then(
                () => {
                    runDialog({
                        open: false
                    });
                    runSnackbar(true, 'Poll limit has been updated.');
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
                    this.props.poll.getLimit().then((limit) => {
                        runDialog({
                            open: true,
                            title: 'Limit Options',
                            content: <Form originalLimit={limit} />,
                            onProceed: () => {
                                proceed();
                            }
                        });
                    });
                }}
            >
                Limit Options
            </MenuItem>
        );
    }
}
