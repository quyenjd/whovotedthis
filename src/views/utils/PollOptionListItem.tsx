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
    Tooltip,
    withStyles
} from '@material-ui/core';
import HowToVoteIcon from '@material-ui/icons/HowToVote';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { runDialog } from '../../utils/Dialog';
import { runSnackbar } from '../../utils/Snackbar';
import ConfigPool, { Consumable } from '../../utils/ConfigPool';

let newValue = '';

// Form element to handle `change` state of fields, for editing option values
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
    rank: number;
    up: () => void;
}

/**
 * Pool-enabled element to handle upvote button's appearance.
 */
class PollOptionUpvote extends Component<Pick<Props, 'up'>> {
    mobx: Consumable<{ voting: boolean }>;

    constructor(props: Pick<Props, 'up'>) {
        super(props);

        this.mobx = ConfigPool.requireConsumable(
            this,
            ['PollOption'],
            ['voting'],
            [false]
        );
    }

    render() {
        const MyTooltip = withStyles((theme) => ({
            tooltipPlacementTop: {
                marginBottom: theme.spacing(1)
            }
        }))(Tooltip);

        return !this.mobx.state.voting
            ? (
                <ListItemSecondaryAction>
                    <MyTooltip title="Upvote" arrow placement="top">
                        <IconButton edge="end" onClick={() => this.props.up()}>
                            <ArrowUpwardIcon />
                        </IconButton>
                    </MyTooltip>
                </ListItemSecondaryAction>
            )
            : (
                <></>
            );
    }
}

interface State {
    anchorEl: HTMLElement | null;
}

/**
 * Interface element for each poll option.
 */
export default class PollOptionListItem extends Component<Props, State> {
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
                            ? `Average rank: ${option.result.toFixed(2)}`
                            : this.props.stage === 'voting'
                                ? `You're ranking this #${this.props.rank}.`
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
                    : this.props.stage === 'voting' && this.props.rank > 1
                        ? (
                            <PollOptionUpvote up={this.props.up} />
                        )
                        : (
                            <></>
                        )}
            </ListItem>
        );
    }
}
