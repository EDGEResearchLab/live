var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var http = require('http');
var logger = require('morgan');
var path = require('path');
var socketio = require('socket.io');

var db = require('./lib/db.js');

var live = require('./routes/live');
var vor = require('./routes/vor');
var predict = require('./routes/predict');
var mini = require('./routes/mini');
var api = require('./routes/api');

var config = require('./config');
var app = express();

global.dbo = new db.connection(config.mongo);

// Templates folder for html generation
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
// Default template, that all others populate:
app.set('layout', 'layout');
app.enable('view cache');
app.engine('hjs', require('hogan-express'));

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
// Parser for urlencoded multiform data, used for SATCOM parsing
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Our routes
app.use('/', live.router);
app.use('/live', live.router);
app.use('/vor', vor.router);
app.use('/predict', predict.router);
app.use('/mini', mini.router);

app.use('/api', api.router);

// Any paths that aren't already registered are handled
// by the error page (404):
app.use('*', function(req, res, next) {
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
api.setWhitelist(config.whitelist);
predict.setup(app, io);

server.listen(port, function() {
    console.log("Server listening on *:" + port);
});
