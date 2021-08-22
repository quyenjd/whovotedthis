import { Component, useState } from 'react';
import PollBodyElementProps from './PollBodyElementProps';
import {
    DialogContentText,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Tooltip
} from '@material-ui/core';
import HowToVoteIcon from '@material-ui/icons/HowToVote';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';

let newValue = '';

const Form = function ({
    originalValue,
    proceed
}: {
    originalValue: string;
    proceed: () => void;
}) {
    const [value, setValue] = useState(originalValue);
    newValue = value;

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
                label="New Value"
                fullWidth
                value={value}
                required
                onChange={(event) => {
                    setValue(event.target.value);
                }}
            />
        </form>
    );
};

interface Props extends PollBodyElementProps {
    index: number;
    up: () => void;
}

interface State {
    anchorEl: HTMLElement | null;
}

export default class PollOption extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            anchorEl: null
        };
    }

    render() {
        const option = this.props.options[this.props.index];

        const close = () => {
            this.setState({
                anchorEl: null
            });
        };

        const proceed = () => {
            runSnackbar(true, 'Updating option value...', 0);
            this.props.poll.updateOption(option.id, newValue).then(
                () => {
                    runDialog({
                        open: false
                    });
                    runSnackbar(true, 'Option value has been updated.');
                    this.props.itemRefresher();
                },
                (error) => {
                    runSnackbar(true, error.message);
                }
            );
        };

        return (
            <ListItem>
                <ListItemIcon>
                    <HowToVoteIcon />
                </ListItemIcon>
                <ListItemText
                    primary={option.value}
                    secondary={
                        this.props.stage === 'closed'
                            ? `Rate: ${option.result}`
                            : undefined
                    }
                />
                {this.props.stage === 'open'
                    ? (
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                onClick={(event) => {
                                    this.setState({
                                        anchorEl: event.currentTarget
                                    });
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={this.state.anchorEl}
                                keepMounted
                                open={Boolean(this.state.anchorEl)}
                                onClose={close}
                            >
                                <MenuItem
                                    onClick={() => {
                                        close();
                                        runDialog({
                                            open: true,
                                            title: 'Edit Option',
                                            content: (
                                                <Form
                                                    originalValue={option.value}
                                                    proceed={proceed}
                                                />
                                            ),
                                            onProceed: () => {
                                                proceed();
                                            }
                                        });
                                    }}
                                >
                                Edit
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        close();
                                        runDialog({
                                            open: true,
                                            title: 'Remove Option',
                                            content: (
                                                <DialogContentText>
                                                Are you sure you want to remove
                                                the option?
                                                </DialogContentText>
                                            ),
                                            onProceed: () => {
                                                runSnackbar(
                                                    true,
                                                    'Removing option...',
                                                    0
                                                );
                                                this.props.poll
                                                    .removeOption(option.id)
                                                    .then(
                                                        () => {
                                                            runDialog({
                                                                open: false
                                                            });
                                                            runSnackbar(
                                                                true,
                                                                'Option has been removed.'
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
                                        });
                                    }}
                                >
                                Remove
                                </MenuItem>
                            </Menu>
                        </ListItemSecondaryAction>
                    )
                    : this.props.stage === 'voting' && this.props.index
                        ? (
                            <ListItemSecondaryAction>
                                <Tooltip title="Upvote">
                                    <IconButton
                                        edge="end"
                                        onClick={() => this.props.up()}
                                    >
                                        <ArrowUpwardIcon />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        )
                        : (
                            <></>
                        )}
            </ListItem>
        );
    }
}
