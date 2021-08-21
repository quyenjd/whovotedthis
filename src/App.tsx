import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import ConfigPool from './utils/ConfigPool';
import Dialog from './utils/Dialog';
import Snackbar from './utils/Snackbar';
import Landing from './views/Landing';
import PortalLogin from './views/PortalLogin';

export default function App() {
    ConfigPool.start();

    return (
        <>
            <Router>
                <Switch>
                    <Route path="/portal">
                        <PortalLogin />
                    </Route>
                    <Route path="/">
                        <Landing />
                    </Route>
                </Switch>
            </Router>
            <Dialog />
            <Snackbar />
        </>
    );
}
