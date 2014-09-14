var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var http = require('http');
var logger = require('morgan');
var db = require('./lib/db.js');
var path = require('path');
var socketio = require('socket.io');

var live = require('./routes/live');
var vor = require('./routes/vor');
var mini = require('./routes/mini');
var api = require('./routes/api');

var config = require('./config');

global.dbo = db.connection(config);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.set('layout', 'layout');
app.enable('view cache');
app.engine('hjs', require('hogan-express'));

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', live.router);
app.use('/live', live.router);
app.use('/vor', vor.router);
//app.use('/predict', predict.router);
app.use('/mini', mini.router);

app.use('/api', api);

// Error Handlers
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.createServer(app);
var io = socketio.listen(server);
var port = process.env.PORT || 3000;

vor.setup(app, io);
live.setup(app, io);

server.listen(port, function() {
    console.log("Server listening on *:" + port);
});

