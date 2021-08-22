import { Slide, Snackbar as MaterialSnackbar } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import { Component } from 'react';
import ConfigPool, { Consumable } from './ConfigPool';

const MySlide = (props: TransitionProps) => {
    return <Slide {...props} direction="up" />;
};

/**
 * Set the state of the global snackbar element.
 *
 * @param open true to make the snackbar appear, false to disappear.
 * @param content Content of the snackbar
 * @param duration How long does it take for the snackbar to wait before disappearing.
 */
export function runSnackbar(open: boolean, content = '', duration = 3000) {
    ConfigPool.set(['Snackbar', 'content'], content);
    ConfigPool.set(['Snackbar', 'duration'], duration);
    ConfigPool.set(['Snackbar', 'open'], open);
}

interface State {
    open: boolean;
    content: string;
    duration: number;
}

/**
 * Global Pool-enabled snackbar element.
 */
export default class Snackbar extends Component<Record<never, never>, State> {
    mobx: Consumable<State>;

    constructor(props: Record<never, never>) {
        super(props);

        this.mobx = ConfigPool.requireConsumable(
            this,
            ['Snackbar'],
            ['open', 'content', 'duration'],
            [false, '', 0]
        );
    }

    render() {
        return (
            <MaterialSnackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
                open={this.mobx.state.open}
                autoHideDuration={
                    this.mobx.state.duration
                        ? this.mobx.state.duration
                        : undefined
                }
                TransitionComponent={MySlide}
                message={this.mobx.state.content}
                onClose={() => {
                    this.setState({
                        open: false
                    });
                }}
            />
        );
    }
}
