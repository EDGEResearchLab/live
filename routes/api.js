var binary = require('binary');
var moment = require('moment');
var express = require('express');
var router = express.Router();

var hash = require('../lib/hash');
var whitelist = [];

router.all('/report', function(req, res) {
    switch (req.method) {
        case 'POST':
            if (newPointCheckAndEmit(req.body, req)) {
                res.status(202).send('Accepted');
            } else {
                res.status(400).send('invalid json payload');
            }
            break;
        default:
            res.status(405).send("Method not allowed");
            break;
    }
});

// Used for dev/debug - Not for publishing
router.post('/vor', function(req, res) {
    req.app.emit('testpoint', req.body);
    res.status(200).send("nice.");
});

// TODO - Whitelist DBO
router.post('/satcom', function(req, res) {
    satcomPostHandler(req);
    // **Always** give a 200, otherwise we back-up
    // the rockblock's queue and mess up our dataset.
    res.status(200).send("");
});

router.post('/predict', function(req, res) {
    res.status(200).send("");
});

var dayUtcToEpoch = function(day, utc) {
    day = day.toString();
    utc = utc.toString();                                                                            
    if (day.length < 6) {
        day = '0' + day;
    }
    if (utc.length < 8) {
        utc = '0' + utc;
    }
    utc = utc.substr(0, utc.length - 2);
    return moment(day + '' + utc, 'MMDDYYHHmmss') / 1000; // utc, epoch
};

var satcomPostHandler = function(req) {
    try {
        var buff = new Buffer(req.body.data, 'hex');
        // Hex, Little Endian
        var vars = binary.parse(buff)
            .word32ls('lat')
            .word32ls('lon')
            .word32ls('alt')
            .word16lu('spd')
            .word16lu('dir')
            .word32lu('day')
            .word32lu('utc')
            // We don't really care about these on the server.
            //.word32lu('age')
            //.word16lu('hdr')
            .vars;

        var dataPoint = {
            edgeId: ('imei' in req.body) ? req.body.imei :  "",
            latitude: vars.lat / 1000000,
            longitude: vars.lon / 1000000,
            altitude: vars.alt / 100,
            speed: (vars.speed >> 16) / 100,
            direction: (vars.dir & 0xFFFF),
            time: dayUtcToEpoch(vars.day, vars.utc),
            source: 'satcom'
        };

        newPointCheckAndEmit(dataPoint, req);
    } catch (e) {
        console.log('Error receiving from satcom: ' + e);
    }
};

var newPointCheckAndEmit = function(newpoint, req) {
    var myDbo = dbo;
    if (isValidJson(newpoint)) {
        console.log('New Point: ' + JSON.stringify(newpoint));
        verifyNewPoint(newpoint, function(res) {
            if (!res) {
                console.log('Rejected Duplicate Point.');
            } else {
                if (whitelist.length > 0 && whitelist.indexOf(newpoint['edgeId'].toLowerCase()) == -1) {
                    console.log('Rejected point: ' + JSON.stringify(newpoint));
                    return;
                }
                console.log('Accepted new point: ' + JSON.stringify(newpoint));
                newpoint['receiptTime'] = new Date().getTime();
                myDbo.saveTrack(newpoint);
                
                // Hash the edge id since we use them for whitelisting.
                newPoint['edgeId'] = hash.hashit(newPoint['edgeId']);
                req.app.emit('newpoint', newpoint);
            }
        });
        return true;
    } else {
        return false;
    }
};

/**
 * Check if the JSON payload is valid, as far as we know.
 */
var isValidJson = function(js) {
    var fields = {
        edgeId: /^[-a-z0-9_]+$/i, // digits, a-z, _ and -
        latitude: /^[-+]?\d{1,3}(?:\.\d+)?$/, // decimal degrees.
        longitude: /^[-+]?\d{1,3}(?:\.\d+)?$/, // decimal degrees.
        altitude: /^[0-9]+(?:\.\d+)?$/, // int or double
        speed: /^[0-9]+(?:\.\d+)?$/, // int or double
        time: /^[0-9]+$/, // int (seconds since epoch)
        source: /^[-_ .,:;0-9a-z]+$/i // Pretty much whatever.
    };

    for (var key in fields) {
        if (!(key in js) || !fields[key].test(js[key])) {
            console.log('Invalid Edge JSON (based on key "' + key + '"): ' + js[key]);
            return false;
        }
    }

    return true;
};

var verifyNewPoint = function(js, onSuccessCb) {
    // Fields used to check for a duplicate.
    var query = {
        edgeId: js.edgeId,
        latitude: js.latitude,
        longitude: js.longitude,
        time: js.time
    };

    dbo.getTracks(query)
        .then(function(docs) {
            onSuccessCb(docs.length === 0);
        })
        .catch(console.err);
};

module.exports = {
    router: router,
    setWhitelist: function(list) {
        whitelist = list;
    }
};

