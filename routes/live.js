var express = require('express');
var hash = require('../lib/hash');
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
                console.log('New Client "' + sock.id + '"');

                var myDbo = dbo;
                myDbo.getLatestFlight()
                    .then(function(doc) {
                        console.log('Latest Flight: ' + doc.name);

                        var query = {
                            time: {
                                $gte: doc.begin,
                                $lte: doc.end
                            }
                        };
                        // This limits what is retrieved from mongo, similar to the "X,Y,Z" in:
                        // `Select X,Y,Z FROM TABLE`
                        var proj = {
                            _id: 0,
                            edgeId: 1,
                            latitude: 1,
                            longitude: 1,
                            altitude: 1,
                            speed: 1,
                            time: 1
                        };

                        myDbo.getTracks(query, proj)
                            .then(function(docs) {
                                console.log('Found ' + docs.length + ' docs for client "' + sock.id + '".');
                                for (var i = 0; i < docs.length; i++) {
                                    docs[i].edgeId = hash.hashit(docs[i].edgeId);
                                }
                                sock.emit('initialpoints', docs);
                            })
                            .catch(function(err) {
                                console.log('Error retrieving the tracks: ' + err);
                            });
                    })
                    .catch(function(err) {
                        console.error('Error retrieving the lastest flight: ' + err);
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
