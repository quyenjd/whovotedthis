import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Container,
    Grid,
    Link,
    Paper,
    Typography,
    withStyles
} from '@material-ui/core';
import GroupOutlinedIcon from '@material-ui/icons/GroupOutlined';
import PollOutlinedIcon from '@material-ui/icons/PollOutlined';
import SecurityOutlinedIcon from '@material-ui/icons/SecurityOutlined';
import { Component, ReactElement } from 'react';
import { Parallax } from 'react-parallax';
import LinkUtil from '../utils/Link';
import banner from '../banner.jpg';

const MyContainer = withStyles({
    root: {
        padding: '20vh 0 30vh',
        textAlign: 'center',
        color: '#fff'
    }
})(Container);

const MyTypography = withStyles((theme) => ({
    root: {
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        [theme.breakpoints.down('xs')]: {
            fontSize: theme.typography.h3.fontSize,
            letterSpacing: '0.1em'
        }
    }
}))(Typography);

const MyButton = withStyles((theme) => ({
    root: {
        marginTop: theme.spacing(5),
        color: '#fff',
        background: theme.palette.primary.main,
        '&:hover': {
            background: theme.palette.primary.dark
        },
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        fontSize: theme.typography.h6.fontSize
    }
}))(Button);

const MyPaper = withStyles((theme) => ({
    root: {
        paddingTop: theme.spacing(6),
        paddingBottom: theme.spacing(6),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3)
    }
}))(Paper);

const Quote = withStyles((theme) => ({
    root: {
        padding: theme.spacing(3),
        color: '#999',
        display: 'block',
        fontSize: theme.typography.h5.fontSize,
        fontWeight: 300,
        textAlign: 'center',
        textTransform: 'none'
    }
}))(Typography);

const MyCardMedia = withStyles((theme) => ({
    root: {
        '& svg': {
            height: '3em',
            width: '3em',
            margin: '0 auto',
            display: 'block',
            paddingTop: theme.spacing(2)
        }
    }
}))(CardMedia);

const MyCardContent = withStyles({
    root: {
        textAlign: 'center'
    }
})(CardContent);

export interface Criterion {
    icon: ReactElement;
    title: string;
    content: string;
}

export default class Landing extends Component {
    criteria: Criterion[] = [
        {
            icon: <PollOutlinedIcon color="secondary" />,
            title: 'Polling',
            content:
                "Voting is conducted in polls. Each poll has three stages: Open, Voting, and Closed. Voters add options at Open, rate other voters' options at Voting, and see the results at Closed stage."
        },
        {
            icon: <GroupOutlinedIcon color="primary" />,
            title: 'Anonymity',
            content:
                'It is guaranteed that no voters, as well as administrators, know which voters the options belong to.'
        },
        {
            icon: <SecurityOutlinedIcon color="error" />,
            title: 'Transparency',
            content:
                'A poll once closed cannot be edited/removed in any way, and its results are open to everyone involves.'
        }
    ];

    render() {
        return (
            <>
                <Parallax bgImage={banner} bgImageAlt="banner" strength={300}>
                    <div
                        style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            width: '100%'
                        }}
                    >
                        <MyContainer fixed>
                            <MyTypography
                                variant="h2"
                                variantMapping={{ h2: 'h1' }}
                                gutterBottom
                                style={{ fontWeight: 'bold' }}
                            >
                                whovotedthis
                            </MyTypography>
                            <Typography
                                variant="h5"
                                variantMapping={{ h5: 'h3' }}
                                style={{ fontWeight: 'bold' }}
                            >
                                Simple{' '}
                                <Box display="inline" fontStyle="italic">
                                    anonymous
                                </Box>{' '}
                                voting system.
                            </Typography>
                            <LinkUtil
                                to="/portal"
                                style={{ textDecoration: 'none' }}
                            >
                                <MyButton variant="contained">
                                    Get Started
                                </MyButton>
                            </LinkUtil>
                        </MyContainer>
                    </div>
                </Parallax>
                <Container
                    fixed
                    style={{ zIndex: 1, position: 'relative', top: '-10vh' }}
                >
                    <MyPaper elevation={3}>
                        <Quote>
                            This application serves as a demonstration for our
                            project in the{' '}
                            <Link href="https://peddiehacks.peddie.org/">
                                PeddieHacks
                            </Link>{' '}
                            hackathon 2021. It has been implemented to meet all
                            the criteria listed below.
                        </Quote>
                        <Grid container spacing={3} justifyContent="center">
                            {this.criteria.map((criterion, index) => {
                                return (
                                    <Grid item xs={12} md={4} key={index}>
                                        <Card elevation={0}>
                                            <MyCardMedia>
                                                {criterion.icon}
                                            </MyCardMedia>
                                            <MyCardContent>
                                                <Typography
                                                    variant="h6"
                                                    gutterBottom
                                                >
                                                    {criterion.title}
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    gutterBottom
                                                    style={{ fontWeight: 300 }}
                                                >
                                                    {criterion.content}
                                                </Typography>
                                            </MyCardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                        <Quote>
                            Check it out by clicking the Get Started button
                            above.
                        </Quote>
                    </MyPaper>
                </Container>
            </>
        );
    }
}
