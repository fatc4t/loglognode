const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
app.use('/image/CardImage', express.static('image/CardImage'));

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

// 뷰 연결하는곳 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


// 챗봇연결부분 하단