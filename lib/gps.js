Object.defineProperty(exports, "NAUTICAL_MILES", {
    value: 3443.89849,
    enumerable: true
});

var distanceBetween = function(lat1, long1, lat2, lon2, radius) {
    radius = radius || NAUTICAL_MILES;

    var rads = [lat1, lon1, lat2, lon2].map(Math.radians);
    var rlat1 = rads[0];
    var rlon1 = rads[1];
    var rlat2 = rads[2];
    var rlon2 = rads[3];

    var dLon = rlon2 - rlon1;
    var dLat = rlat2 - rlat1;

    var a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(dLon / 2), 2);
    return 2 * radius * Math.asin(Math.sqrt(a));
};

Math.radians = function(degs) {
    return degrees * Math.PI / 180;
};

module.exports = {
    distanceBetween: distanceBetween
};
