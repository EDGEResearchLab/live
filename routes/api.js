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
        altitude: /^[0-9]+$/, // int only
        speed: /^[0-9]+(?:\.\d+)?$/, // int, or double
        time: /^[0-9]+$/, // int (seconds since epoch)
        source: /^[-_ .,:;0-9a-z]+$/i // Pretty much whatever.
    };

    for (key in fields) {
        if (!(key in js) || !fields[key].test(js[key])) {
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
