var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    // TODO: Get Latest of All Points from the DB
    res.status(200).send("Lat:<br/>Lon:<br/>Alt:<br>");
});

module.exports = {
    router: router
};
