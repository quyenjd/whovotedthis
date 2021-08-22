import { Typography } from '@material-ui/core';
import { Component } from 'react';
import PollBodyElementProps from './PollBodyElementProps';

interface State {
    loaded: boolean;
}

/**
 * An element to show `Poll.getInfo` in the poll body.
 */
export default class PollInfo extends Component<PollBodyElementProps, State> {
    info: string;

    constructor(props: PollBodyElementProps) {
        super(props);

        this.state = {
            loaded: false
        };
    }

    componentDidMount() {
        this.props.poll.getInfo().then((info) => {
            if (info !== this.info) {
                this.info = info;
                this.setState({
                    loaded: true
                });
            }
        });
    }

    componentDidUpdate() {
        this.componentDidMount();
    }

    render() {
        if (!this.state.loaded || !this.info.length) return <></>;
        return (
            <Typography
                variant="body2"
                gutterBottom
                style={{ whiteSpace: 'pre-wrap' }}
            >
                {this.info}
            </Typography>
        );
    }
}
