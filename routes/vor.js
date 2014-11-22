var express = require('express');
var router = express.Router();
var Promises = require('bluebird');
var hash = require('../lib/hash');
var gps = require('../lib/gps');

// Socket.IO namespace
var namespace = null;
// Cache the latest sent data
var latestResult = {};

router.get('/', function(req, res) {
    res.locals = {
        title: 'EDGE Live'
    };
    res.render('vor');
});

// We are assuming that we as the server are being responsible.
var handleNewConnection = function(sock) {
    var myDbo = dbo; // dbo is global
    myDbo.getLatestFlight()
        .then(function(doc) {
            console.log('Latest Flight: ' + doc.name);

            var query = {
                receiptTime: {
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
                time: 1,
                receiptTime: 1
            };

            myDbo.getTracks(query, proj)
                .then(function(docs) {
                    console.log('VOR: Finding latest point for client ' + sock.id);

                    var items = {};
                    docs.forEach(function(doc) {
                        if (!(doc.edgeId in items)) {
                            items[doc.edgeId] = doc;
                        } else if (doc.receiptTime > items[doc.edgeId].receiptTime) {
                            items[doc.edgeId]  = doc;
                        }
                    });

                    var latestPoints = [];
                    for (var key in items) {
                        items[key].edgeId = hash.hashit(items[key].edgeId);
                        latestPoints.push(items[key]);
                    }

                    findVorsForPoint(latestPoints)
                        .then(function(results) {
                            results.forEach(function(r) {
                                sock.emit('point', r);
                            });
                        })
                        .catch(function(err) {
                            console.log('Error: ' + err);
                        });
                })
                .catch(function(err) {
                    console.log('Error retrieving the tracks: ' + err);
                });
        })
        .catch(function(err) {
            console.error('Error retrieving the lastest flight: ' + err);
        });
    if ('point' in latestResult && 'vors' in latestResult) {
        sock.emit('point', latestResult);
    }
};

var handleNewPoint = function(point) {
    console.log('VOR: Received new point to publish: ' + JSON.stringify(point));

    findVorsForPoint(point)
        .then(function(results) {
            results.forEach(function(r) {
                namespace.emit('point', r);
            });
        })
        .catch(function(err) {
            console.log('Error finding vors for point: ' + err);
        });
};

var findVorsForPoint = function(points) {
    var deferred = Promises.pending();

    function sortOnDistance(a, b) {
        if (a.distance < b.distance) return -1;
        if (a.distance > b.distance) return 1;
        return 0;
    }

    getVors(function(docs) {
        if (!(Array.isArray(points))) {
            points = [points];
        }

        var results = [];

        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var res = {
                point: point,
                vors: []
            };

            for (var j = 0; j < docs.length; j++) {
                docs[i].distance = gps.distanceBetween(point.latitude, point.longitude, docs[i].latitude, docs[i].longitude);
            }

            docs.sort(sortOnDistance);

            for (var k = 0; k < 2; k++) {
                docs[k].bearing = gps.bearing(docs[k].latitude, docs[k].longitude, point.latitude, point.longitude);
                docs[k] = formatForFAA(docs[k]);
                res.vors.push(docs[k]);
            }

            res.point = formatForFAA(res.point);
            results.push(res);
        }

        console.log('Found VORS for points: ' + JSON.stringify(results));

        deferred.resolve(results);
    });

    return deferred.promise;
};

// Convert our formatting to stuff that the FAA would want to see.
var formatForFAA = function(doc) {
    // Avoid rounding, truncate the value off.
    function truncate(x) {
        if (x < 0) {
            return Math.ceil(x);
        }
        return Math.floor(x);
    }

    function dd_to_dm(dd) {
        deg = truncate(dd);
        min = Math.abs((dd - deg) * 60).toFixed(6);

        return deg.toString() + '° ' + min.toString() + "'";
    }

    // latitude dd -> degrees decimal minutes
    doc.faaLatitude = dd_to_dm(doc.latitude);
    // longitude dd -> degrees decimal minutes
    doc.faaLongitude = dd_to_dm(doc.longitude);

    // altitude m -> ft
    doc.altitude *= 3.28084;

    return doc;
};

var getVors = function(callback) {
    var query = {
        state: {
            $in: ['CO', 'KS']
        }
    };
    var proj = {
        _id: 0,
        latitude: 1,
        longitude: 1,
        call: 1
    };

    dbo.getVors(query, proj)
        .then(callback)
        .catch(console.err);
};

module.exports = {
    router: router,
    setup: function(app, io) {
        // Initialize the socket io namespace.
        if (namespace === null) {
            namespace = io.of('/vor');
            namespace.on('connection', handleNewConnection);
        }

        // Initialize the newpoint event listener.
        app.on('newpoint', handleNewPoint);
        app.on('testpoint', handleNewPoint);
    }
};
