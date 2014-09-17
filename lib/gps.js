Object.defineProperty(exports, "NAUTICAL_MILES", {
    value: 3443.89849,
    enumerable: true
});

var distanceBetween = function(lat1, lon1, lat2, lon2, radius) {
    radius = radius || exports.NAUTICAL_MILES;

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

// http://gis.stackexchange.com/questions/29239/calculate-bearing-between-two-decimal-gps-coordinates
var bearing = function(startLat, startLon, endLat, endLon) {
    startLat = Math.radians(startLat);
    startLon = Math.radians(startLon);
    endLat = Math.radians(endLat);
    endLon = Math.radians(endLon);

    var dLon = endLon - startLon;
    var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
    if (Math.abs(dLon) > Math.PI) {
        if (dLon > 0.0) {
            dLon = -(2.0 * Math.PI - dLon);
        } else {
            dLon = (2.0 * Math.PI + dLon);
        }
    }

    return (Math.degrees(Math.atan2(dLon, dPhi)) + 360.0) % 360;
};

Math.radians = function(degs) {
    return degs * Math.PI / 180;
};

Math.degrees = function(rads) {
    return rads * (180 / Math.PI);
};

module.exports = {
    distanceBetween: distanceBetween,
    bearing: bearing
};
