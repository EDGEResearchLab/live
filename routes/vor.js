var express = require('express');
var router = express.Router();
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
function handleNewConnection(socket) {
    if ('point' in latestResult && 'vors' in latestResult) {
        socket.emit('point', latestResult);
    }
}

function handleNewPoint(point) {
    var latestResult = {
        point: point,
        vors: []
    };
    getVors(function(docs) {
        for(var i = 0; i < docs.length; i++) {
            docs[i]['distance'] = gps.distanceBetween(point.latitude, point.longitude, docs[i].latitude, docs[i].longitude);
        }
        docs.sort(function(a, b) {
            if (a.distance < b.distance) return -1;
            if (a.distance > b.distance) return 1;
            return 0;
        });
        latestResult.vors.push(docs[0]);
        latestResult.vors.push(docs[1]);
        namespace.emit('point', latestResult);
    });
}

function getVors(callback) {
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
}

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
    }
};
