var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express.io');
var favicon = require('serve-favicon');
var logger = require('morgan');
var mongo = require('mongodb');
var monk = require('monk');
var path = require('path');

var live = require('./routes/live');
var api = require('./routes/api');

var db = monk('mongodb://edgerl:rosebud@kahana.mongohq.com:10082/edge-rl-test');

var app = express();
app.http().io();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
    req.db = db;
    next();
});

// Pages
app.use('/', live);
// API
app.use('/api', api);
// Socket Connections
app.io.route('vor', function(req) {
    req.io.broadcast('evt', {message: 'data'});
    // req.io.emit('talk', {message: 'hi'});
});

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

if (app.get('env') == 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

module.exports = app;

