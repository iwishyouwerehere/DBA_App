process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { pool } = require('./database');
const routes = require('./routes');
const dbViewRouter = require('./viewDb');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use('/', routes);

app.use('/', dbViewRouter);

app.use(express.json());


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});