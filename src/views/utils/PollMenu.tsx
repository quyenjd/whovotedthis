import { Button, Container, Menu, withStyles } from '@material-ui/core';
import { Component } from 'react';
import Profile from '../../utils/Profile';
import PollBodyElementProps from './PollBodyElementProps';
import PollMenuEdit from './PollMenuEdit';
import PollMenuRemove from './PollMenuRemove';
import PollMenuAddOption from './PollMenuAddOption';
import PollMenuStage from './PollMenuStage';
import PollMenuJoin from './PollMenuJoin';

const MyContainer = withStyles((theme) => ({
    root: {
        marginTop: theme.spacing(1),
        display: 'block',
        width: '100%',
        textAlign: 'center'
    }
}))(Container);

interface State {
    anchorEl: HTMLElement | null;
}

export default class PollMenu extends Component<PollBodyElementProps, State> {
    constructor(props: PollBodyElementProps) {
        super(props);

        this.state = {
            anchorEl: null
        };
    }

    render() {
        const close = () => {
            this.setState({
                anchorEl: null
            });
        };

        // Poll join
        const pollJoin =
            this.props.stage === 'voting' &&
            Profile.require('poll:vote') &&
            !this.props.voted
                ? (
                    <PollMenuJoin {...this.props} close={close} />
                )
                : undefined;

        // Add option
        const addOption =
            this.props.stage === 'open' &&
            Profile.require('poll:option:add')
                ? (
                    <PollMenuAddOption {...this.props} close={close} />
                )
                : undefined;

        // Poll edit
        const pollEdit =
            this.props.stage !== 'closed' && Profile.require('poll:update')
                ? (
                    <PollMenuEdit {...this.props} close={close} />
                )
                : undefined;

        // Poll remove
        const pollRemove =
            this.props.stage !== 'closed' && Profile.require('poll:remove')
                ? (
                    <PollMenuRemove {...this.props} close={close} />
                )
                : undefined;

        // Change poll stage
        const pollStage =
            this.props.stage !== 'closed' &&
            Profile.require('poll:stage:change')
                ? (
                    <PollMenuStage {...this.props} close={close} />
                )
                : undefined;

        return pollJoin || addOption || pollEdit || pollRemove || pollStage
            ? (
                <MyContainer disableGutters>
                    <Button
                        variant="contained"
                        onClick={(event) => {
                            this.setState({
                                anchorEl: event.currentTarget
                            });
                        }}
                    >
                    Operations
                    </Button>
                    <Menu
                        anchorEl={this.state.anchorEl}
                        keepMounted
                        open={Boolean(this.state.anchorEl)}
                        onClose={() => {
                            this.setState({
                                anchorEl: null
                            });
                        }}
                    >
                        {pollJoin}
                        {addOption}
                        {pollEdit}
                        {pollRemove}
                        {pollStage}
                    </Menu>
                </MyContainer>
            )
            : (
                <></>
            );
    }
}
