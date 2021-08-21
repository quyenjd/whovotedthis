const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const json = require('./package.json');

// Create Express Server
const app = express();

// Configuration
const PORT = 5000;
const HOST = 'localhost';
const API_SERVICE_URL = json.homepage;

// Logging
app.use(morgan('dev'));

// Proxy endpoints
app.use('/~/build', createProxyMiddleware({
    target: API_SERVICE_URL,
    secure: false,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    pathRewrite: {
        [`^/~/build`]: '/'
    },
}));

// Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});