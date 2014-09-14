var centerOnBalloon = true;
var trackables = {}; // hash for identifier/poly for client updates
var hasReceivedPoints = false;
var debug = true;

var logDebug = function(msg) {
    if (debug) {
        console.debug(msg);
    }
};

$(document).ready(function() {
    initSocketIo();
});

var initSocketIo = function() {
    var socket = io.connect('http://localhost:3000/live');
    socket.on('connect', handleOnConnect);
    socket.on('disconnect', handleOnDisconnect);
    socket.on('points', handleInitialPoints);
    socket.on('point', handleNewPoint);
};

var handleOnConnect = function() {
    console.log('Connected to the EDGE-RL live stream.');

    var statusIcon = $('#statusIcon');
    statusIcon.attr('src', 'images/status_ok.png');
    statusIcon.attr('title', 'Connected');

    // Blow out the old stuff since all points are resent on new connection.
    for (var t in trackables) {
        t.clearPath();
    }
    trackables = {};
};

var handleOnDisconnect = function() {
    console.log('Disconnected from the EDGE-RL live stream.');

    var statusIcon = $('#statusIcon');
    statusIcon.attr('src', 'images/status_error.png');
    statusIcon.attr('title', 'Disconnected.')
};

var handleInitialPoints = function(initial_points) {
    logDebug("Loading initial points.");

    try {
        var tracker_points = initial_points;

        // we get an array of trackables and their points
        // {"id" : "uuid", "points" : []}
        for (var i = 0; i < tracker_points.length; i++) {
            var thisTrackable = tracker_points[i];
            var thisId = thisTrackable['edgeId'];
            var points = thisTrackable['points'];

            logDebug("New Trackable: " + thisId);
            trackables[thisId] = new Trackable(map, getDefaultPolyOpts());

            // and an array of points
            for (var j = 0; j < points.length; j++) {
                var thisPoint = points[j];
                logDebug("Tracking point: " + JSON.stringify(thisPoint));
                trackables[thisTrackable['id']].addPoint(thisPoint['latitude'], thisPoint['longitude']);
            }
        }

    } catch (e) { 
        console.error(e);
    }
};

var handleNewPoint = function(point_content) {
    try {
        logDebug("Received new point: " + JSON.stringify(point_content));
        var thisTrackable = point_content;
        var thisId = thisTrackable['edgeId'];

        if (!trackables[thisId]) {
            logDebug("New trackable: " + thisId);
            trackables[thisId] = new Trackable(map, getDefaultPolyOpts());
        }

        trackables[thisId].addPoint(thisTrackable.latitude, thisTrackable.longitude);
    } catch (e) {
        console.error(e);
    }
};

function Trackable(gmap, polyOpts) {
    this.gmap = gmap;
    this.poly = Trackable._initPoly(gmap, polyOpts);
}

Trackable.prototype.addPoint = function(latitude, longitude) {
    var point = new google.maps.LatLng(latitude, longitude);
    var path = this.poly.getPath();
    path.push(point);

    // Set the map's center to the first received point.
    if (!hasReceivedPoints) {
        this.gmap.setCenter(point);
        hasReceivedPoints = true;
    }
};

Trackable.prototype.clearPath = function() {
    this.poly.getPath().clear();
};

Trackable._initPoly = function(gmap, opts) {
    var poly = new google.maps.Polyline(opts);
    poly.setMap(gmap);
    return poly;
};
