var trackables = {};
var okIcon = 'images/status_ok.png';
var errIcon = 'images/status_error.png';

$(document).ready(function() {
    initSocket();
});

var initSocket = function() {
    var url = document.URL;
    if (!(/\predict$/.test(url))) {
        url += 'predict';
    }

    console.log('Web Socket URL: ' + url);

    var socket = io.connect(url);
    socket.on('connect', ioOnConnect);
    socket.on('disconnect', ioOnDisconnect);
    socket.on('prediction', ioOnPrediction);
};

var updateStatusIcon = function(imageSrc, title) {
    var statusIcon = $('#statusIcon');
    if (imageSrc) {
        statusIcon.attr('src', imageSrc);
    }
    if (title) {
        statusIcon.attr('title', title);
    }
};

var ioOnConnect = function() {
    console.log('Connected to the EDGE-RL prediction stream.');
    updateStatusIcon(okIcon, 'Connected ' + new Date());
};

var ioOnDisconnect = function() {
    console.log('Disconnected from the EDGE-RL prediction stream.');
    updateStatusIcon(errIcon, 'Disconnected ' + new Date());
};

var ioOnPrediction = function(prediction) {
    try {
        console.log('[' + prediction.edgeId + '] Update: ' + JSON.stringify(prediction));
        updateStatusIcon(null, 'Last Update: ' + new Date());
        
        if (trackables[prediction.edgeId] !== undefined) {
            trackables[prediction.edgeId].setMap(null);
        }

        trackables[prediction.edgeId] = new google.maps.Marker({
            position: new google.maps.LatLng(prediction.latitude, prediction.longitude),
            map: map,
            title: prediction.edgeId
        });
    } catch (e) {
        console.error(e);
    }
};
