var binary = require('binary');
var moment = require('moment');
var express = require('express');
var router = express.Router();

router.all('/report', function(req, res) {
    switch (req.method) {
        case 'POST':
            reportPostHandler(req, res);
            break;
        default:
            res.status(405).send("Method not allowed");
            break;
    }
});

router.post('/satcom', function(req, res) {
    satcomPostHandler(req);
    // **Always** give a 200, otherwise we back-up
    // the rockblock's queue and mess up our dataset.
    res.status(200).send("");
});

var dayUtcToEpoch = function(day, utc) {
    day = day.toString();
    utc = utc.toString();                                                                            
    if (day.length < 6) day = '0' + day;
    if (utc.length < 8) utc = '0' + utc;
    utc = utc.substr(0, utc.length - 2);
    return moment(day + '' + utc, 'MMDDYYHHmmss') / 1000; // utc, epoch
};

var satcomPostHandler = function(req) {
    try {
        console.log('Received Satcom: ' + req);

        var js = req.body;
        var buff = new Buffer(js.data, 'hex');
        // Hex, Little Endian
        var vars = binary.parse(buff)
            .word32ls('lat') // /1000000
            .word32ls('lon') // /1000000
            .word32ls('alt') // /100
            .word16lu('spd') // >>16 /100
            .word16lu('dir') // &0xffff /100
            .word32lu('day') // if len < 5, pad with 0
            .word32lu('utc') // if len < 5, pad with 0
            //.word32lu('age') // We don't care about these.
            //.word16lu('hdr')
            .vars;

        var dataPoint = {
            edgeId: ('imei' in js) ? js.imei :  "",
            latitude: vars.lat / 1000000,
            longitude: vars.lon / 1000000,
            altitude: vars.alt / 100,
            speed: (vars.speed >> 16) / 100,
            direction: (vars.dir & 0xFFFF),
            time: dayUtcToEpoch(vars.day, vars.utc),
            source: 'satcom'
        };

        if (isValidJson(dataPoint)) {
            console.log('Satcom: ' + JSON.stringify(dataPoint));
            req.app.emit('newpoint', dataPoint);
        }
    } catch (e) {
        console.log('Error receiving from satcom: ' + e);
    }
}

function reportPostHandler(req, res) {
    // TODO: Verify source.
    var js = req.body;
    var myDbo = dbo; // avoid name conflict in callback
    if (isValidJson(js)) {
        verifyNewPoint(js, function(res) {
            if (!res) {
                console.error('Rejected duplicate point.');
            } else {
                js['receiptTime'] = new Date().getTime();
                req.app.emit('newpoint', js);
                myDbo.saveTrack(js);
            }
        });
        res.status(202).send("accepted");
    } else {
        res.status(400).send("invalid json payload");
    }
}

/**
 * Check if the JSON payload is valid, as far as we know.
 */
function isValidJson(js) {
    var fields = {
        edgeId: /^[a-z0-9]+$/i, // digits, a-z only
        latitude: /^[-+]?\d{1,3}(?:\.\d+)?$/, // decimal degrees.
        longitude: /^[-+]?\d{1,3}(?:\.\d+)?$/, // decimal degrees.
        altitude: /^[0-9]+(?:\.\d+)?$/, // int or double
        speed: /^[0-9]+(?:\.\d+)?$/, // int or double
        time: /^[0-9]+$/, // int (seconds since epoch)
        source: /^[-_ .,:;0-9a-z]+$/i // Pretty much whatever.
    };

    for (key in fields) {
        if (!(key in js) || !fields[key].test(js[key])) {
            console.log('Invalid Edge JSON: ' + JSON.stringify(js));
            return false;
        }
    }

    return true;
}

function verifyNewPoint(js, onSuccessCb) {
    var query = {
        edgeId: js.edgeId,
        latitude: js.latitude,
        longitude: js.longitude,
        time: js.time
    };

    dbo.getTracks(query)
        .then(function(docs) {
            onSuccessCb(docs.length == 0);
        })
        .catch(console.err);
}

module.exports = router;
