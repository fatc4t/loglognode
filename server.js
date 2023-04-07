const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const http = require('http').Server(app);

app.use(bodyParser.json());
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true})) 
app.use(express.json())
require('dotenv').config()
app.use(cors());
app.use('/', require('./routes/postgre.js') );

http.listen(process.env.PORT, function() {
    console.log('listening on 8889')
});


