import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import axios from 'axios';

// Content-Type header for all axios requests
axios.defaults.headers = {
    'Content-Type': 'application/json'
};

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
