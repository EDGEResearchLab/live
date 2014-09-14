var express = require('express');
var router = express.Router();

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
    if ('point' in latestResult 
        && 'vors' in latestResult) {
        socket.emit('point', latestResult);
    }
}

function handleNewPoint(point) {
    try {
        console.log('Vor: Received new point: ' + JSON.stringify(point));
        latestResult = {
            point: point,
            vors: findClosestVors(point.latitude, point.longitude, 2)
        };
        namespace.emit('point', latestResult);
    } catch (e) {
        console.error(e);
    }
}

function findClosestVors(latitude, longitude, count) {
    count = count || 2;
    
    //get all vors from the db
    //calculate relation to lat/lon
}

var gpsDistanceTo = function(lat1, lon1, lat2, lon2) {
    var nmiRadius = 3443.89849; // radius in nautical miles

    var rads = [lat1, lon1, lat2, lon2].map(Math.radians);
    var rlat1 = rads[0];
    var rlon1 = rads[1];
    var rlat2 = rads[2];
    var rlon2 = rads[3];

    var dLon = rlon2 - rlon1;
    var dLat = rlat2 - rlat1;

    var a = math.pow(math.sin(dLat / 2), 2) + math.cos(rlat1) * math.cos(rlat2) * math.pow(math.sin(dLon / 2), 2);
    return 2 * nmiRadius * math.asin(math.sqrt(a));
};

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
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
    }
};
