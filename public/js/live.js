var centerOnBalloon = true;
var trackables = {}; // hash for identifier/poly for client updates
var hasReceivedPoints = false;

$(document).ready(function() {
    initSocketIo();
});

var initSocketIo = function() {
    var url = document.URL;
    if (!(/\/live$/.test(url))) {
        url += 'live';
    }
    console.log('Web Socket URL: ' + url);
    var socket = io.connect(url);
    socket.on('connect', handleOnConnect);
    socket.on('disconnect', handleOnDisconnect);
    socket.on('point', handleNewPoint);
    socket.on('initialpoints', handleInitialPoints);
};

var updateStatusIcon = function(image_src, title) {
    var statusIcon = $('#statusIcon');

    if (image_src) {
        statusIcon.attr('src', image_src);
    }

    if (title) {
        statusIcon.attr('title', title);
    }
};

var handleOnConnect = function() {
    console.log('Connected to the EDGE-RL live stream.');

    updateStatusIcon('images/status_ok.png', 'Connected');

    // Blow out the old stuff since all points are resent on new connection.
    for (var t in trackables) {
        try {
            t.clearPath();
        } catch (e) {
            console.debug(e);
        }
    }
    trackables = {};
};

var handleOnDisconnect = function() {
    console.log('Disconnected from the EDGE-RL live stream.');

    updateStatusIcon('images/status_error.png', 'Disconnected');
};

var handleInitialPoints = function(initial_points) {
    for (var i = 0; i < initial_points.length; i++) {
        handleNewPoint(initial_points[i]);
    }
};

var handleNewPoint = function(point_content) {
    try {
        var thisTrackable = point_content;
        var thisId = thisTrackable['edgeId'];

        if (!trackables[thisId]) {
            console.debug('[' + thisId + '] New Trackable');
            trackables[thisId] = new Trackable(map, getDefaultPolyOpts());
        }

        console.debug('[' + thisId + '] Update');
        updateStatusIcon(null, 'Last Update: ' + new Date());
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
