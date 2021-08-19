import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Landing from './views/Landing';
import Portal from './views/Portal';

export default function App() {
    return (
        <Router>
            <Switch>
                <Route path="/portal">
                    <Portal />
                </Route>
                <Route path="/">
                    <Landing />
                </Route>
            </Switch>
        </Router>
    );
}
