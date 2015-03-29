var binary = require('binary');
var moment = require('moment');

var jspack = require('jspack').jspack;
var express = require('express');
var router = express.Router();

var winston = require('winston');

var hash = require('../lib/hash');
var whitelist = [];

var logger = new winston.Logger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: '/root/live/routes/api.log',
			level: 'debug'
		})
	]
});

router.post('/satcom', function(req, res) {
    logger.info('Satcom Headers: ' + JSON.stringify(req.headers));
    logger.info('Body: ' + req.body);
    logger.info('Raw Satcom Request: ' + JSON.stringify(req.body));
    satcomPostHandler(req);
    // **Always** give a 200, otherwise we back-up
    // the rockblock's queue and mess up our dataset.
    res.status(200).send("");
});

router.post('/predict', function(req, res) {
    try {
        if (!('edgeId' in req.body)) {
            res.status(400).send('Missing EdgeId');
            return;
        } else if (!isWhiteListed(req.body.edgeId)) {
            res.status(400).send('Bad edge id.');
            return;
        }

        var newPoint = req.body;
        newPoint.edgeId = hash.hashit(newPoint.edgeId);
        console.log(newPoint.edgeId);
        req.app.emit('prediction', newPoint);
        res.status(200).send("OK");
    } catch (e) {
        console.log('/predict error: ' + e);
        res.status(500).send(e);
    }
});

var dayUtcToEpoch = function(day, utc) {
    day = day.toString();
    utc = utc.toString();
    if (day.length < 6) {
        day = '0' + day.toString();
    }
    if (utc.length < 8) {
        utc = '0' + utc.toString();
    }
    utc = utc.substr(0, utc.length - 2);
    return moment(day + '' + utc, 'MMDDYYHHmmss') / 1000; // utc, epoch
};

var satcomPostHandler = function(req) {
    try {
        var buff = new Buffer(req.body.data, 'hex');
	var struct = jspack.Unpack('>lllhhlll', buff);

	var lat =  struct[0] / 1e6;
	var lon =  struct[1] / 1e6;
	var alt =  struct[2] / 100;
	var spd =  struct[3] / 100;
	var dir =  struct[4] / 100;
	var day =  struct[5];
	var utc =  struct[6];
	var age =  struct[7];

        var dataPoint = {
            edgeId: ('imei' in req.body) ? req.body.imei :  "",
            latitude: lat,
            longitude: lon,
            altitude: alt,
            speed: spd,
            direction: dir,
            time: dayUtcToEpoch(day, utc),
            source: 'satcom'
        };

        console.log('Data Point: ' + JSON.stringify(dataPoint));

        newPointCheckAndEmit(dataPoint, req);
    } catch (e) {
	logger.error('Error receiving from satcom: ' + e);
    }
};

var newPointCheckAndEmit = function(newpoint, req) {
    var myDbo = dbo;
    if (isValidJson(newpoint)) {
        console.log('New Point: ' + JSON.stringify(newpoint));
        verifyNewPoint(newpoint, function(res) {
            if (!res) {
		logger.debug('Rejected duplicate point.');
            } else {
                if (!isWhiteListed(newpoint.edgeId.toLowerCase())) {
                    return;
                }

                console.log('Accepted new point for EdgeId: ' + newpoint.edgeId);
                // Grab receipt time (ish) to know a rough estimate of reporting latencies.
                newpoint.receiptTime = parseInt(new Date().getTime() / 1000);
                myDbo.saveTrack(newpoint);

                // Hash the edge id since we use them for whitelisting.
                newpoint.edgeId = hash.hashit(newpoint.edgeId);
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

var isWhiteListed = function(edgeId) {
    if (whitelist.length > 0 && whitelist.indexOf(edgeId) == -1) {
        console.log('EdgeId "' + edgeId + '" not whitelisted.');
        return false;
    }
    return true;
};

module.exports = {
    router: router,
    setWhitelist: function(list) {
        whitelist = list;
    }
};

