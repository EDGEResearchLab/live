var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    console.log('app: ' + req.app);
    res.render('live', {
        title: 'EDGE Live'
    });
});

module.exports = {
    router: router,
    setup: function(app, io) {
        if (namespace === null) {
            namespace = io.of('/live');
            namespace.on('connection', function(sock) {
                console.log('Live: Client Connected');
            });
        }

        app.on('newpoint', function(js) {
            try {
                console.log('Live: Received new point: ' + JSON.stringify(js));
                //strip down to min required for publish
                //publish to ws.
                var emittable = {message: "live test"};
                namespace.emit('update', emittable);
            } catch (e) {
                console.error(e);
            }
        });
    }
};

