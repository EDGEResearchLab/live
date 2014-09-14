var express = require('express');
var router = express.Router();

/**
 * Return a minified summary of the most recent flight's
 * trackables and their latest position/altitude/speed
 */
router.get('/', function(req, res) {
    // TODO: Get Latest of All Points from the DB and build the reply
    dbo.db.collection('flights')
        .find()
        .sort({begin: -1})
        .limit(1)
        .toArray(function(err, docs) {
            dbo.db.collection('trackers')
                .find({time: {$gt: docs[0].begin, $lt: docs[0].end}})
                .sort({time: -1})
                .toArray(function(err, docs) {
                    var dataString = '';
                    for (var i = 0; i < docs.length; i++) {
                        var thisDoc = docs[i];
                        dataString += 'Id:' + thisDoc.edgeId + '<br>';
                        dataString += 'Lat:' + thisDoc.latitude + '<br>';
                        dataString += 'Lon:' + thisDoc.longitude + '<br>';
                        dataString += 'Alt:' + thisDoc.altitude + '<br>';
                        dataString += 'Spd:' + thisDoc.speed + '<br>';
                        dataString += '<hr/>';
                    }
                    res.status(200).send(dataString);
                });
        });
});

module.exports = {
    router: router
};
