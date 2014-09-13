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
    if (validJson(js)) {
        req.app.emit('event:newpoint', js);
        res.status(200).send("Success");
    } else {
        res.status(400).send("invalid json payload");
    }
}

/**
 * Check if the JSON payload is valid, as far as we know.
 */
function validJson(js) {
    // TODO: Regex to verify data.
    /*var fields = [
        'edgeId': /[a-z0-9]/i, // digits, a-z only
        'latitude': /[-+]?\d{1,3}\.\d+/, // decimal degrees.
        'longitude': /[-+]?\d{1,3}\.\d+/, // decimal degrees.
        'altitude': /[0-9]+/, // int only
        'speed': /[0-9]+(?:\.\d+)?/, // int, or double
        'time': /[0-9]+/, // int (seconds since epoch)
        'source': /[-_ .,:;0-9a-z]+/i // Pretty much whatever.
    ];*/
    var requiredFields = ['edgeId', 'latitude', 'longitude',
        'altitude', 'speed', 'time', 'source'];

    for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (!(field in js) || js[field] === "") {
            return false;
        }
    }

    return true;
}

module.exports = router;
