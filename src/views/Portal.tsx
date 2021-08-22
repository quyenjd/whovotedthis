import React, { useState } from 'react';
import clsx from 'clsx';
import {
    createStyles,
    makeStyles,
    Theme,
    Drawer,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    AppBar,
    IconButton,
    Toolbar,
    DialogContentText,
    TextField,
    Divider
} from '@material-ui/core';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import HomeIcon from '@material-ui/icons/Home';
import MenuIcon from '@material-ui/icons/Menu';
import PollIcon from '@material-ui/icons/Poll';
import Link from '../utils/Link';
import PortalPolls from './PortalPolls';
import { runDialog } from '../utils/Dialog';
import Profile from '../utils/Profile';
import { runSnackbar } from '../utils/Snackbar';
import { version } from '../../package.json';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1
        },
        menuButton: {
            marginRight: theme.spacing(2)
        },
        title: {
            flexGrow: 1
        },
        list: {
            width: 250
        },
        fullList: {
            width: 'auto'
        }
    })
);

export default function TemporaryDrawer() {
    const classes = useStyles();
    const [state, setState] = React.useState<{
        anchorEl: null | HTMLElement;
        open: boolean;
        password: string;
    }>({
        anchorEl: null,
        open: false,
        password: ''
    });

    const toggleDrawer =
        (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
            if (
                event.type === 'keydown' &&
                ((event as React.KeyboardEvent).key === 'Tab' ||
                    (event as React.KeyboardEvent).key === 'Shift')
            ) {
                return;
            }

            setState({ ...state, open });
        };

    const list = () => (
        <div
            className={clsx(classes.list, {
                [classes.fullList]: false
            })}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List>
                <Link
                    to="/"
                    style={{ color: 'inherit', textDecoration: 'inherit' }}
                >
                    <ListItem button>
                        <ListItemIcon>
                            <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItem>
                </Link>
                <ListItem button selected>
                    <ListItemIcon>
                        <PollIcon />
                    </ListItemIcon>
                    <ListItemText primary="Polls" />
                </ListItem>
                <Divider />
                <ListItem disabled>
                    <ListItemText secondary={`whovotedthis v${version}`} />
                </ListItem>
            </List>
        </div>
    );

    const menuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setState({
            ...state,
            anchorEl: event.currentTarget
        });
    };

    const menuClose = () => {
        setState({
            ...state,
            anchorEl: null
        });
    };

    const passwordChangeSubmit = (password: string) => {
        runSnackbar(true, 'Updating your password...', 0);
        Profile.changePassword(password).then(
            () => {
                runDialog({
                    open: false
                });
                runSnackbar(
                    true,
                    'Your password has been updated successfully.'
                );
            },
            (error) => {
                runSnackbar(true, error.message);
            }
        );
    };

    const passwordChange = () => {
        let inputPassword = '';

        const Form = function () {
            const [password, setPassword] = useState('');
            inputPassword = password;

            return (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        passwordChangeSubmit(password);
                    }}
                >
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={password}
                        required
                        onChange={(event) => {
                            setPassword(event.target.value);
                        }}
                    />
                </form>
            );
        };

        runDialog({
            open: true,
            title: 'Change Password',
            content: (
                <>
                    <DialogContentText>
                        Please enter your new password in the box below.
                    </DialogContentText>
                    <Form />
                </>
            ),
            onProceed: () => passwordChangeSubmit(inputPassword)
        });

        menuClose();
    };

    const logout = () => {
        runDialog({
            open: true,
            title: 'Logout',
            content: (
                <DialogContentText>
                    Are you sure you want to logout?
                </DialogContentText>
            ),
            closeText: 'No',
            proceedText: 'Yes',
            onProceed: () => {
                runSnackbar(true, 'Logging you out...', 0);
                Profile.logout().then(
                    () => {
                        location.reload();
                    },
                    () => {
                        location.reload();
                    }
                );
            }
        });

        menuClose();
    };

    return (
        <>
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            className={classes.menuButton}
                            color="inherit"
                            onClick={toggleDrawer(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={classes.title}>
                            Polls
                        </Typography>
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={menuOpen}
                        >
                            <AccountCircleIcon />
                        </IconButton>
                        <Menu
                            anchorEl={state.anchorEl}
                            keepMounted
                            open={Boolean(state.anchorEl)}
                            onClose={menuClose}
                        >
                            <List disablePadding>
                                <MenuItem disabled>
                                    Logged in as: {Profile.require('portal')}
                                </MenuItem>
                            </List>
                            <Divider light />
                            <List style={{ paddingBottom: 0 }}>
                                {Profile.require('password:change')
                                    ? (
                                        <MenuItem onClick={passwordChange}>
                                        Change Password
                                        </MenuItem>
                                    )
                                    : (
                                        <></>
                                    )}
                                {Profile.require('logout')
                                    ? (
                                        <MenuItem onClick={logout}>Logout</MenuItem>
                                    )
                                    : (
                                        <></>
                                    )}
                            </List>
                        </Menu>
                    </Toolbar>
                </AppBar>
                <Drawer
                    anchor="left"
                    open={state.open}
                    onClose={toggleDrawer(false)}
                >
                    {list()}
                </Drawer>
            </div>
            <PortalPolls />
        </>
    );
}
