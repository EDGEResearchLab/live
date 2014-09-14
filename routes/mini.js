var express = require('express');
var router = express.Router();

/**
 * Return a minified summary of the most recent flight's
 * trackables and their latest position/altitude/speed
 */
router.get('/', function(req, res) {
    // TODO: Get Latest of All Points from the DB and build the reply
    res.status(200).send("Lat:<br/>Lon:<br/>Alt:<br>");
});

module.exports = {
    router: router
};
