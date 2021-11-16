const client = require('./database.js');
const express = require('express');
const app = express();
const path = require('path');

const homeRouter = require('./routes/home.routes');
const datatableRouter = require('./routes/datatable.routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname + "public")));

app.use('/', homeRouter);
app.use('/datatable', datatableRouter);

app.listen(3300, () => {
    console.log("Server is now listening at port 3300");
})

client.connect();
