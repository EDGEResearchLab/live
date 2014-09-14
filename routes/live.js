var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    console.log('app: ' + req.app);
    res.locals = {title: 'EDGE Live'};
    res.render('live');
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
                var unwantedFields = ['source', 'id'];
                // Strip out unnecessary fields for the client to work.
                for (var i = 0; i < unwantedFields.length; i++) {
                    var field = unwantedFields[i];
                    if (field in js) {
                        delete js[field];
                    }
                }
                //publish to ws.
                namespace.emit('point', js);
            } catch (e) {
                console.error(e);
            }
        });
    }
};
