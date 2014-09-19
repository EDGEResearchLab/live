centerOnBalloon = true;
map = undefined;

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

var initMap = function(map_id, map_options) {
    var map_elem = $('#' + map_id).get(0);
    if (!map_elem) {
        console.error('Map Element not found.');
        throw new Error("Map Element '" + map_id + "' not found.");
    }
    var map = new google.maps.Map(map_elem, map_options);
    createAutoCenterControl(map);
    return map;
};

var createAutoCenterControl = function(gmap) {
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
   controlUI.title = 'Click to select which balloon to automatically center on.';
   controlDiv.appendChild(controlUI);

   // Create and set-up the control interiorS
   var controlText = document.createElement('div');
   controlText.style.fontFamily = 'Arial,sans-serif';
   controlText.style.fontSize = '12px';
   controlText.style.paddingLeft = '4px';
   controlText.style.paddingRight = '4px';
   controlText.innerHTML = 'Auto Center <span style="font-weight:bold;font-size:12px;">' + ((centerOnBalloon) ? 'ON' : 'OFF')  + '</span>';
   controlUI.appendChild(controlText);

   // Make the control clickable, toggle the text to reflect the current state.
   google.maps.event.addDomListener(controlDiv, 'click', function() {
       centerOnBalloon = !(centerOnBalloon);
       if (centerOnBalloon) {
           //change the message of controlDiv
           controlText.innerHTML = 'Auto Center <span style="font-weight:bold;font-size:12px;">ON</span>';
       } else {
           controlText.innerHTML = 'Auto Center <span style="font-weight:bold;font-size:12px;">OFF</span>';
       }
   });

   controlDiv.index = 1;
   gmap.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
};

var getDefaultPolyOpts = function() {
    var opts = {
        strokeColor: generateRandomHexColor(),
        strokeOpacity: 1.0,
        strokeWeight: 4
    };
    return opts;
};

var generateRandomHexColor = function() {
    var chars = "ABCDEF0123456789";
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += chars[Math.floor(Math.random() * (chars.length))];
    }
    return color;
};
