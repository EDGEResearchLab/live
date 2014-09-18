var express = require('express');
var router = express.Router();

/**
 * Return a minified summary of the most recent flight's
 * trackables and their latest position/altitude/speed
 */
router.get('/', function(req, res) {
    var myDbo = dbo;
    dbo.getLatestFlight()
        .then(function(doc) {
            console.log('Latest Flight: ' + JSON.stringify(doc));
            var aggregation = [
                {
                    // Find all in the latest flight (based on time)
                    $match: {
                        time: {
                            $gte: doc.begin, 
                            $lte: doc.end
                        }
                    }
                },
                {
                    // Sort based on time, descending
                    $sort: {
                        time: -1
                    }
                },
                {
                    // Create a document with what we care about.
                    $group: {
                        _id: '$edgeId', 
                        time: {
                            $first: '$time'
                        }, 
                        latitude: {
                            $first: '$latitude'
                        },
                        longitude: {
                            $first: '$longitude'
                        },
                        altitude: {
                            $first: '$altitude'
                        },
                        speed: {
                            $first: '$speed'
                        }
                    }
                }
            ];
            myDbo.aggregateTracks(aggregation)
                .then(function(docs) {
                    console.log('Found Docs: ' + docs);

                    var dataString = '';
                    for (var i = 0; i < docs.length; i++) {
                        var thisDoc = docs[i];
                        dataString += 'Id:' + thisDoc._id + '<br/>';
                        dataString += 'Lat:' + thisDoc.latitude + '<br/>';
                        dataString += 'Lon:' + thisDoc.longitude + '<br/>';
                        dataString += 'Alt:' + thisDoc.altitude + '<br/>';
                        dataString += 'Spd:' + thisDoc.speed + '<br/>';
                        dataString += '<hr/><br/>';
                    }

                    res.status(200).send(dataString);
                })
                .catch(function(err) {
                    res.status(500).send(err);  
                });
        })
        .catch(function(err) {
            res.status(500).send(err);
        });
});

module.exports = {
    router: router
};
