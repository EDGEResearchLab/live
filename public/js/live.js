var trackables = {}; // hash for identifier/poly for client updates

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

var handleNewPoint = function(newPoint) {
    try {
        var thisId = newPoint['edgeId'];

        // We will autocenter on the first received point (total)
        // to orient the user to wherever we are launching from.
        // After that, it will be up to the user to use map controls
        if ($.isEmptyObject(trackables)) {
            map.setCenter(new google.maps.LatLng(newPoint.latitude, newPoint.longitude));
        }

        if (!trackables[thisId]) {
            console.debug('[' + thisId + '] New Trackable');
            var polyOpts = getDefaultPolyOpts();
            trackables[thisId] = new Trackable(map, polyOpts);
            newInfoDisplay(thisId, polyOpts.strokeColor);
        }

        if (!$.isEmptyObject(trackables[thisId].latestPoint)) {
            // Calculate the ascent rate in m/s.
            newPoint['ascentRate'] = (function() {
                try {
                    var altDelta = newPoint.altitude - trackables[thisId].latestPoint.altitude;
                    var timeDelta = newPoint.time - trackables[thisId].latestPoint.time;
                    if (!timeDelta) {
                        return 'NaN';
                    }

                    return (altDelta / timeDelta).toFixed(1);
                } catch (e) {
                    console.error('ascentRate calc error: ' + e);
                    return 'err';
                }
            }());
        }

        console.debug('[' + thisId + '] Update');
        // This doesn't really reflect reality on load, may need to update that to be
        // the timestamp of the last received point.
        updateStatusIcon(null, 'Last Update: ' + new Date());
        trackables[thisId].addPoint(newPoint);
        updateInfoDisplay(thisId, newPoint);
        
        // Globally set and toggled via an overlay on the map (map.js)
        if (centerOnBalloon) {
            centerMap();
        }
    } catch (e) {
        console.error(e);
    }
};

var centerMap = function() {
    var lat = 0;
    var lng = 0;
    var num = 0;

    // Average out the latitude/longitude for centering.
    // We are assuming that the trackables will all be 
    // somewhat near each other, as this does not account
    // for zoom.
    for (var key in trackables) {
        lat += trackables[key].latestPoint.latitude;
        lng += trackables[key].latestPoint.longitude;
        num++;
    }

    if (num !== 0) {
        lat /= num;
        lng /= num;
        map.setCenter(new google.maps.LatLng(lat, lng));
    }
};

var newInfoDisplay = function(id, color) {
    var elems = [
        '<div id="' + id + '">',
            '<span class="title">EdgeID: ' + id + '</span>',
            '<span class="latitude"></span>, <span class="longitude"></span><br/>',
            'Alt: <span class="altitude"></span>m, ',
            'Rate: <span class="rate"></span>m/s',
        '</div>'
    ];

    $('#flightInfo').append(elems.join(''));
    $('#flightInfo > #' + id + ' > .title').css('border-bottom', 'solid 1px ' + (color || '#000'));
};

var updateInfoDisplay = function(id, infoPoint) {
    var idsInfo = $('#flightInfo > #' + id);
    idsInfo.find('.altitude').text(parseFloat(infoPoint.altitude).toFixed(1));
    idsInfo.find('.rate').text(infoPoint.ascentRate);
    idsInfo.find('.latitude').text(infoPoint.latitude);
    idsInfo.find('.longitude').text(infoPoint.longitude);
};

function Trackable(gmap, polyOpts) {
    this.gmap = gmap;
    this.poly = Trackable._initPoly(gmap, polyOpts);
    this.latestPoint = {};
}

/**
 * Add a new point to the map.
 * @param: newPoint - This should be a hash of typical GPS data: 
 * latitude (DD), longitude (DD), altitude (M), time (S since Epoch), and speed (m/s).
 */
Trackable.prototype.addPoint = function(newPoint) {
    var point = new google.maps.LatLng(newPoint.latitude, newPoint.longitude);
    var path = this.poly.getPath();
    path.push(point);
    this.latestPoint = newPoint;
};

Trackable.prototype.clearPath = function() {
    this.poly.getPath().clear();
};

Trackable._initPoly = function(gmap, opts) {
    var poly = new google.maps.Polyline(opts);
    poly.setMap(gmap);
    return poly;
};
