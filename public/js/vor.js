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
    initVorSocketIo();
});

var initVorSocketIo = function() {
    // Setup the websocket connection
    var socket = io.connect('http://localhost:3000/vor');
    socket.on('connect', handleOnConnect);
    socket.on('disconnect', handleOnDisconnect);
    socket.on('points', handleNewPoint);
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
 * the form {'vors': [], 'point': {}, 'edge_id': ''}
 * @return void
 */
var handleNewPoint = function(point_content) {
    try {
        console.log(JSON.stringify(point_content));
        updateStatusIcon(null, 'Last Update: ' + new Date());
        var thisTrackable = point_content;
        var vors = thisTrackable['vors'];
        var thisId = thisTrackable['edgeId'];

        if (!trackables[thisId]) {
            console.debug("New Trackable: " + thisId);
            trackables[thisId] = new VorTrackable(map, getDefaultPolyOpts());
        }

        console.debug("Update for " + thisId);
        // TODO - plot it
        // updateUi(point_content);
    } catch (e) {
        console.error(e);
    }
};

/**
 * Update the UI with updated trackable info.
 *
 * @parse point_content - Data point from the server with data to display.
 * @return void
 */
var updateUi = function(point_content) {
    var vor1 = $('#vor1_info');
    var vor2 = $('#vor2_info');
}

/**
 * Object for a trackable object in the VOR system.
 *
 * @param gmap - Google map the trackable belongs to.
 * @param polyOpts - Options defining how the poly looks.
 * @return void
 */
function VorTrackable(gmap, polyOpts) {
    this.gmap = gmap;
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

/**
 * Clear the poly ling from the map.
 * 
 * @return void
 */
VorTrackable.prototype.clear = function() {
    // Remove all points from the polies.
    console.log(this.polies);
    for (var i = 0; i < this.polies.length; i++) {
        var path = this.polies[i].getPath();
        path.clear();
    }

    // Remove the markers from the map before clearing the array
    // Otherwise the references are lost and we can't edit them,
    // and they will stay visible.
    for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
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
 * Clear the path of the poly.
 *
 * @return void
 */
VorTrackable.prototype.clearPath = function() {
    this.poly.getPath().clear();
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
