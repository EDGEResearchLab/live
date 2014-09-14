var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    res.locals = {title: 'EDGE Live'};
    res.render('vor');
});

module.exports = {
    router: router,
    setup: function(app, io) {
        // Initialize the socket io namespace.
        if (namespace === null) {
            namespace = io.of('/vor');
            namespace.on('connection', function(sock) {
                console.log('VOR: Client connected');
            });
        }

        // Initialize the newpoint event listener.
        app.on('newpoint', function(js) {
            try {
                console.log('Vor: Received new point: ' + JSON.stringify(js));
                // find closest
                // publish to ws
                namespace.emit('point', js);
            } catch (e) {
                console.error(e);
            }
        });
    }
};
