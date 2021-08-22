import { Component, ReactElement } from 'react';
import {
    Dialog as MaterialDialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@material-ui/core';
import ConfigPool, { Consumable } from './ConfigPool';

interface State {
    open: boolean;
    onClose: () => void;
    onProceed: () => void;
    closeText: string;
    proceedText: string;
    content: ReactElement;
    title: string;
}

/**
 * Set the state of the global dialog element.
 *
 * @param state State to be passed to the dialog.
 */
export function runDialog(state: Partial<State>) {
    ConfigPool.set(['Dialog', 'state'], {
        ...ConfigPool.get(['Dialog', 'state']),
        ...state
    });
}

/**
 * Global Pool-enabled dialog element.
 */
export default class Dialog extends Component<
    Record<never, never>,
    { state: State }
> {
    mobx: Consumable<{ state: State }>;

    constructor(props: Record<never, never>) {
        super(props);

        this.mobx = ConfigPool.requireConsumable(
            this,
            ['Dialog'],
            ['state'],
            [
                {
                    open: false,
                    onClose: () => {
                        this.mobx.state.state = {
                            ...this.mobx.state.state,
                            open: false
                        };
                    },
                    onProceed: () => {
                        this.mobx.state.state = {
                            ...this.mobx.state.state,
                            open: false
                        };
                    },
                    closeText: 'Close',
                    proceedText: 'Proceed',
                    content: <></>,
                    title: ''
                } as State
            ]
        );
    }

    render() {
        return (
            <MaterialDialog
                open={this.mobx.state.state.open}
                onClose={this.mobx.state.state.onClose}
            >
                {this.mobx.state.state.title.length
                    ? (
                        <DialogTitle>{this.mobx.state.state.title}</DialogTitle>
                    )
                    : undefined}
                <DialogContent>{this.mobx.state.state.content}</DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.mobx.state.state.onClose}
                        color="secondary"
                    >
                        {this.mobx.state.state.closeText}
                    </Button>
                    <Button
                        onClick={this.mobx.state.state.onProceed}
                        color="primary"
                    >
                        {this.mobx.state.state.proceedText}
                    </Button>
                </DialogActions>
            </MaterialDialog>
        );
    }
}
