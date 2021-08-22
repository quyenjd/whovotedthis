import { Component } from 'react';
import {
    Avatar,
    Button,
    CssBaseline,
    TextField,
    Link,
    Box,
    Typography,
    Container,
    createStyles,
    Theme,
    withStyles,
    WithStyles
} from '@material-ui/core';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Profile from '../utils/Profile';
import Portal from './Portal';
import { runSnackbar } from '../utils/Snackbar';
import LoadingOverlay from 'react-loading-overlay';

const styles = (theme: Theme) =>
    createStyles({
        paper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        avatar: {
            margin: theme.spacing(1),
            backgroundColor: theme.palette.secondary.main
        },
        form: {
            width: '100%', // Fix IE 11 issue
            marginTop: theme.spacing(1)
        },
        submit: {
            margin: theme.spacing(3, 0, 2)
        }
    });

const MyTypography = withStyles((theme) => ({
    root: {
        marginTop: theme.spacing(2)
    }
}))(Typography);

interface States {
    loggedin: boolean;
    username: string;
    password: string;
    error: string | false;
    ready: boolean;
    login: string;
    signup: string;
    disabled: boolean;
}

class PortalLogin extends Component<WithStyles<typeof styles>, States> {
    constructor(props: WithStyles<typeof styles>) {
        super(props);

        this.state = {
            loggedin: false,
            username: '',
            password: '',
            error: false,
            ready: false,
            login: 'Log in',
            signup: 'Sign up as new user',
            disabled: false
        };
    }

    componentDidMount() {
        Profile.reLogin().then(
            () => {
                this.setState({
                    loggedin: !!Profile.require('portal'),
                    ready: true
                });
            },
            () => {
                this.setState({
                    loggedin: false,
                    ready: true
                });
            }
        );
    }

    handleLogin() {
        runSnackbar(true, 'Logging you in...', 0);
        this.setState({
            login: 'Logging in',
            disabled: true
        });
        Profile.login(this.state.username, this.state.password).then(
            () => {
                runSnackbar(true, 'You have been logged in.');
                this.setState({
                    username: '',
                    password: '',
                    loggedin: true,
                    login: 'Log in',
                    disabled: false
                });
            },
            (error) => {
                runSnackbar(false);
                this.setState({
                    error: error.message,
                    login: 'Log in',
                    disabled: false
                });
            }
        );
    }

    handleSignup() {
        runSnackbar(true, 'Signing you up...', 0);
        this.setState({
            signup: 'Signing up',
            disabled: true
        });
        Profile.signup(this.state.username, this.state.password).then(
            () => {
                runSnackbar(true, 'You have been signed up.');
                this.setState({
                    username: '',
                    password: '',
                    loggedin: true,
                    signup: 'Sign up as new user',
                    disabled: false
                });
            },
            (error) => {
                runSnackbar(false);
                this.setState({
                    error: error.message,
                    signup: 'Sign up as new user',
                    disabled: false
                });
            }
        );
    }

    render() {
        const classes = this.props.classes;

        return (
            <>
                {this.state.ready
                    ? (
                        this.state.loggedin
                            ? (
                                <Portal />
                            )
                            : (
                                <Container component="main" maxWidth="xs">
                                    <CssBaseline />
                                    <div className={classes.paper}>
                                        <Avatar className={classes.avatar}>
                                            <LockOutlinedIcon />
                                        </Avatar>
                                        <Typography component="h1" variant="h5">
                                    Log In
                                        </Typography>
                                        <form
                                            className={classes.form}
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                this.handleLogin();
                                            }}
                                        >
                                            <TextField
                                                variant="outlined"
                                                margin="normal"
                                                required
                                                fullWidth
                                                id="username"
                                                label="Username"
                                                autoComplete="username"
                                                autoFocus
                                                value={this.state.username}
                                                onChange={(event) => {
                                                    this.setState({
                                                        username: event.target.value
                                                    });
                                                }}
                                            />
                                            <TextField
                                                variant="outlined"
                                                margin="normal"
                                                required
                                                fullWidth
                                                label="Password"
                                                type="password"
                                                id="password"
                                                autoComplete="current-password"
                                                value={this.state.password}
                                                onChange={(event) => {
                                                    this.setState({
                                                        password: event.target.value
                                                    });
                                                }}
                                            />
                                            {this.state.error
                                                ? (
                                                    <MyTypography
                                                        variant="subtitle2"
                                                        color="error"
                                                    >
                                                        {this.state.error}
                                                    </MyTypography>
                                                )
                                                : undefined}
                                            <Button
                                                type="submit"
                                                fullWidth
                                                disabled={this.state.disabled}
                                                variant="contained"
                                                color="primary"
                                                className={classes.submit}
                                            >
                                                {this.state.login}
                                            </Button>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="secondary"
                                                className={classes.submit}
                                                disabled={this.state.disabled}
                                                style={{ marginTop: 0 }}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    this.handleSignup();
                                                }}
                                            >
                                                {this.state.signup}
                                            </Button>
                                        </form>
                                    </div>
                                    <Box mt={4}>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            align="center"
                                        >
                                            {'whovotedthis @ '}
                                            <Link
                                                color="inherit"
                                                href="https://peddiehacks.peddie.org/"
                                            >
                                        PeddieHacks
                                            </Link>{' '}
                                            {'2021.'}
                                        </Typography>
                                    </Box>
                                </Container>
                            )
                    )
                    : (
                        <></>
                    )}
                <LoadingOverlay
                    active={!this.state.ready}
                    fadeSpeed={300}
                    spinner
                    text={
                        <Typography variant="body1">
                            Verifying your credentials...
                        </Typography>
                    }
                    styles={{
                        wrapper: (base) => ({
                            ...base,
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            zIndex: 999999, // ridiculous value
                            pointerEvents: 'none'
                        })
                    }}
                />
            </>
        );
    }
}

export default withStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1)
    },
    submit: {
        margin: theme.spacing(3, 0, 2)
    }
}))(PortalLogin);
