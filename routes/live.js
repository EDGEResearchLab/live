var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    res.locals = {title: 'EDGE Live'};
    res.render('live');
});

module.exports = {
    router: router,
    setup: function(app, io) {
        if (namespace === null) {
            namespace = io.of('/live');
            namespace.on('connection', function(sock) {
                var myDbo = dbo;
                // TODO: Send all the current points for this flight
                myDbo.getFlights()
                    .then(function(docs) {
                        docs.sort(function(a, b) {
                            if (a.begin < b.begin) return -1;
                            if (a.begin > b.begin) return 1;
                            return 0;
                        });
                        if (docs.length == 0) {
                            console.error('No flights found.');
                            return;
                        }
                        var thisFlight = docs[docs.length - 1];
                        var query = {
                            time: {
                                $gt: thisFlight.begin
                            }
                        };
                        var proj = {
                            _id: 0,
                            edgeId: 1,
                            latitude: 1,
                            longitude: 1,
                            altitude: 1,
                            speed: 1
                        };
                        myDbo.getTracks(query, proj)
                            .then(function(docs) {
                                sock.emit('points', docs);
                            });
                    });
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
