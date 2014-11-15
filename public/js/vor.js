/*
    (c) 2014 All Rights Reserved.

    Google Maps is a trademark of Google, Inc.  Edge Research Lab nor Edge RL
    are affiliated with Google nor any subsidiaries of Google.  The map is used
    under the free developer API.  If the map stops functioning during a flight,
    we probably passed our quota.

    Disclaimer:
        This code is under testing.  All information is obtained from sources
    deemed reliable.  However, the current and/or continued reliability cannot
    be guaranteed.  This software is for demonstration purposes only.  It is
    not recommended to use this software as a sole reliance for guiding, tracking,
    directing, or otherwise instructing any person or object.
        No liability is assumed by the owners, developers, hosts, authors, creators,
    or any affiliated party to this non-exhaustive list.  By using this software,
    users are waiving all liability and agree to hold any other parties involved
    harmless should something occur from using this software.
        You have been warned, so please use this software solely as a reference
    but not as an official guide, tracker, etc.
*/

var trackables = {}; // hash for identifier/poly for client updates

$(document).ready(function() {
    map.setZoom(8); // The VOR page is mostly for an overview.
    initVorSocketIo();
});

var initVorSocketIo = function() {
    // Setup the websocket connection
    var url = document.URL;
    if (!(/\/vor$/.test(url))) {
        url += 'vor';
    }
    console.log('Web Socket URL: ' + url);
    var socket = io.connect(url);
    socket.on('connect', handleOnConnect);
    socket.on('disconnect', handleOnDisconnect);
    socket.on('point', handleNewPoint);
};

/**
 * Update the status icon on the page, this should show
 * the current status of the web socket connection and
 * whether or not live data is streaming.
 *
 * @param image_src - Path to an image icon to use
 * @param title - Title text of the image (shown on hover)
 * @return void
 */
var updateStatusIcon = function(image_src, title) {
    var statusIcon = $('#statusIcon');

    if (image_src) {
        statusIcon.attr('src', image_src);
    }

    if (title) {
        statusIcon.attr('title', title);
    }
};

/**
 * Handle the initial connection with the server.
 *
 * @return void
 */
var handleOnConnect = function() {
    console.log('Connected to the EDGE-RL vor stream.');

    updateStatusIcon('images/status_ok.png', 'Connected');

    // Blow out the old stuff since the latest
    // vor is sent on connection.
    for (var t in trackables) {
        t.clearPath();
    }
    trackables = {};
};

/**
 * Handle the disconnection from the server.
 *
 * @return void
 */
var handleOnDisconnect = function() {
    console.log('Disconnected from the EDGE-RL live stream.');

    updateStatusIcon('images/status_error.png', 'Disconnected');
};

/**
 * Handle receipt of a new point.
 *
 * @param point_content - Data point from the server. Should take
 * the form {'vors': [], 'point': {}}
 * @return void
 */
var handleNewPoint = function(trackable) {
    try {
        updateStatusIcon(null, 'Last Update: ' + new Date());

        var vors = trackable.vors;
        var point = trackable.point;
        var id = point.edgeId;

        if (!trackables[id]) {
            console.debug("New Trackable: " + id);
            trackables[id] = new VorTrackable(id, map, getDefaultPolyOpts());
            addNewUiDisplay(id, trackables[id].colorKey);
        }

        console.debug("Update for: " + id);
        trackables[id].update(point, vors);//todo this method
        updateUi(id, point, vors); // todo
    } catch (e) {
        console.error(e);
    }
};

var addNewUiDisplay = function(id, color) {
    // I think that document.addElement is faster, but seems less
    // legible for creating a large block like this.
    var newUiFeature = [
        '<div id="' + id + '" class="vorInfoPane">',
            '<span class="title">',
                '<h4>Edge ID: ' + id + '</h4>',
            '</span>',
            '<span class="row">',
                '<span class="latlonalt"></span>',
            '</span>',
            '<span class="row">',
                '<label>Call:</label>',
                '<input type="text" class="vor summary" placeholder="vor" readonly/>',
                '<input type="text" class="vor summary" placeholder="vor" readonly/><br/>',
            '</span>',
            '<span class="row">',
                '<label>Bearing:</label>',
                '<input type="text" class="bearing summary" placeholder="bearing" readonly/>',
                '<input type="text" class="bearing summary" placeholder="bearing" readonly/><br/>',
            '</span>',
            '<span class="row">',
                '<label>Distance (nmi):</label>',
                '<input type="text" class="distance summary" placeholder="distance" readonly/>',
                '<input type="text" class="distance summary" placeholder="distance" readonly/><br/>',
            '</span>',
        '</div>'
    ];
    $('#vorInfo').append(newUiFeature.join(''));

    var thisInfo = $('#' + id);
    var thisTitle = thisInfo.find('.title');
    thisTitle.css('border-bottom', 'solid 1px ' + color);
};

/**
 * Update the UI with updated trackable info.
 *
 * @parse point_content - Data point from the server with data to display.
 * @return void
 */
var updateUi = function(id, point, vors) {
    var infoPane = $('#' + id);

    // This looks a little backwards, but first is grabbing the
    // furthest to the right, and we want it ordered, left to right.
    var vorUi = infoPane.find('.vor');
    vorUi.first().val(vors[1].call);
    vorUi.last().val(vors[0].call);

    var bearing = infoPane.find('.bearing');
    bearing.first().val(parseFloat(vors[1].bearing).toFixed(2));
    bearing.last().val(parseFloat(vors[0].bearing).toFixed(2));

    var distance = infoPane.find('.distance');
    distance.first().val(parseFloat(vors[1].distance).toFixed(2));
    distance.last().val(parseFloat(vors[0].distance).toFixed(2));

    var balloon = infoPane.find('.latlonalt').first();
    var balloonDisplay = '';
    balloonDisplay += parseFloat(point.latitude).toFixed(3).toString();
    balloonDisplay += ', ';
    balloonDisplay += parseFloat(point.longitude).toFixed(3).toString();
    if ('altitude' in point) {
        balloonDisplay += ' @ ';
        balloonDisplay += parseFloat(point.altitude).toFixed(0).toString();
        balloonDisplay += 'm';
    }
    balloon.html(balloonDisplay);
};

/**
 * Object for a trackable object in the VOR system.
 *
 * @param gmap - Google map the trackable belongs to.
 * @param polyOpts - Options defining how the poly looks.
 * @return void
 */
function VorTrackable(name, gmap, polyOpts) {
    this.name = name;
    this.gmap = gmap;
    this.colorKey = polyOpts.strokeColor;
    this.markers = [];

    // The poly lines match for the trackable, they
    // will still originate from different sources.
    this.polies = [
        new google.maps.Polyline(polyOpts),
        new google.maps.Polyline(polyOpts)
    ];

    for (var i = 0; i < this.polies.length; i++) {
        this.polies[i].setMap(this.gmap);
    }
}

VorTrackable.prototype.update = function(point, vors) {
    this.clear();

    var points = [
        vors[0],
        point,
        vors[1]
    ];

    for (var i = 0; i < points.length; i++) {
        this.addPoint(points[i].latitude, points[i].longitude);
    }

    this.addMarker(point.latitude, point.longitude);
};

/**
 * Clear the poly ling from the map.
 *
 * @return void
 */
VorTrackable.prototype.clear = function() {
    for (var i = 0; i < this.polies.length; i++) {
        var path = this.polies[i].getPath();
        path.clear();
    }

    // Remove the markers from the map before clearing the array
    // Otherwise the references are lost and we can't edit them,
    // and they will stay visible.
    for (var j = 0; j < this.markers.length; j++) {
        this.markers[j].setMap(null);
    }
    this.markers = [];
};

/**
 * Add a point to the poly line, updating the map.
 *
 * @return void
 */
VorTrackable.prototype.addPoint = function(latitude, longitude) {
    var latLng = new google.maps.LatLng(latitude, longitude);
    for (var i = 0; i < this.polies.length; i++) {
        var path = this.polies[i].getPath();
        path.push(latLng);
    }
};

/**
 * Add a marker to the map.
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @return void
 */
VorTrackable.prototype.addMarker = function(latitude, longitude) {
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: this.gmap,
        title: this.name
    });
    this.markers.push(marker);
};

/**
 * Initialize the Poly Line for the specifc map.
 *
 * @param gmap - Google map to attach to.
 * @param opts - Options for the UI of the poly.
 * @return new Polyline, attached to the map.
 */
VorTrackable._initPoly = function(gmap, opts) {
    var poly = new google.maps.Polyline(opts);
    poly.setMap(gmap);
    return poly;
};

/**
 * Convert decimal degrees into Degrees/Minutes/Seconds.
 *
 * @param decimalDegs - Decimal Degrees to convert
 * @return Hash with degrees/minutes/seconds broken out.
 */
var decimalDegreesToDegMinSec = function(decimalDegs) {
    var deg = decimalDegs | 0;
    var frac = Math.abs(decimalDegs - deg);
    var min = (frac * 60) | 0;
    var sec = frac * 3600 - min * 60;

    return {
        degrees: deg,
        minutes: min,
        seconds: sec
    };
};
