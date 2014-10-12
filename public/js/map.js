centerOnBalloon = true; // Global
map = undefined; // Global

$(document).ready(function() {
    map = initMap('map_canvas', {
        panControl: false,
        scaleControl: true,
        scaleControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        center: new google.maps.LatLng(38.874380, -104.409064),
        streetViewControl: false,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });
});

var setCenter = function(latitude, longitude) {
    map.setCenter(new google.maps.LatLng(latitude, longitude));
}

var initMap = function(mapId, mapOptions) {
    var map_elem = $('#' + mapId).get(0);
    if (!map_elem) {
        console.error('Map Element not found.');
        throw new Error("Map Element '" + mapId + "' not found.");
    }
    var map = new google.maps.Map(map_elem, mapOptions);
    createAutoCenterControl(map);
    return map;
};

var createAutoCenterControl = function(gmap) {
    var setControlText = function() {
        controlText.innerHTML = 'Auto Center <b>' + ((centerOnBalloon) ? 'ON' : 'OFF') + '</b>';
    };

    //Create a new control for auto centering the map
    var controlDiv = document.createElement('div');

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map.
    controlDiv.style.padding = '5px';

    // Create and set-up the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    // controlUI.title = 'Click to select which balloon to automatically center on.';
    controlDiv.appendChild(controlUI);

    // Create and set-up the control interiorS
    var controlText = document.createElement('div');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    setControlText();
    controlUI.appendChild(controlText);

    // Make the control clickable, toggle the text to reflect the current state.
    google.maps.event.addDomListener(controlDiv, 'click', function() {
        centerOnBalloon = !(centerOnBalloon);
        setControlText();
    });

    controlDiv.index = 1;
    gmap.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
};

var getDefaultPolyOpts = function() {
    return {
        strokeColor: generateRandomHexColor(),
        strokeOpacity: 1.0,
        strokeWeight: 4
    };
};

var generateRandomHexColor = function() {
    var chars = 'ABCDEF0123456789';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += chars[Math.floor(Math.random() * (chars.length))];
    }
    return color;
};

var addMarker = function(lat, lon, map, color) {
    color = (color === undefined)
        ? 'ff0000'
        : color.replace('#', '');
    return new google.maps.Marker({
        position: new google.maps.LatLng(lat, lon),
        map: map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color
    });
};
