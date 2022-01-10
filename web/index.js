const client = require('./database.js');
const express = require('express');
const app = express();
const path = require('path');

// auth0
const { auth } = require('express-openid-connect');
require('dotenv').config();

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASEURL,
    clientID: process.env.CLIENTID,
    issuerBaseURL: process.env.ISSUER
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

const homeRouter = require('./routes/home.routes');
const datatableRouter = require('./routes/datatable.routes');
const api = require('./routes/api.routes');
const profile = require('./routes/profile.routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname + "public")));

app.use('/', homeRouter);
app.use('/datatable', datatableRouter);
app.use('/movies', api);
app.use('/profile', profile);

app.use(express.urlencoded({extended: true}));

app.listen(3300, () => {
    console.log("Server is now listening at port 3300");
})

client.connect();
