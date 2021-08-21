import { Component } from 'react';
import { MenuItem } from '@material-ui/core';
import PollBodyElementProps from './PollBodyElementProps';
import { runSnackbar } from '../../utils/Snackbar';

export default class PollMenuAddOption extends Component<
    PollBodyElementProps & { close: () => void }
> {
    render() {
        return (
            <MenuItem
                onClick={() => {
                    this.props.close();
                    runSnackbar(true, 'Adding new option...', 0);
                    this.props.poll.addOption().then(
                        () => {
                            runSnackbar(true, 'An option has been added.');
                            this.props.itemRefresher();
                        },
                        (error) => {
                            runSnackbar(true, error.message);
                        }
                    );
                }}
            >
                Add Option
            </MenuItem>
        );
    }
}
