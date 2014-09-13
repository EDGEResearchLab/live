var express = require('express');
var router = express.Router();

router.get('/flights', function(req, res) {
    var flightTable = req.db.get('flights');
    
    var query = {};
    if (req.query && 'name' in req.query) {
        query['name'] = req.query.name;
    }
    flightTable.find(query, {sort: {name: 1}})
        .success(function(docs) {
            res.send(JSON.stringify(docs));
        });
});

router.get('/vors', function(req, res) {
    var vorTable = req.db.get('vors');

    var query = {};
    if (req.query && 'state' in req.query) {
        var inOper = (typeof req.query.state == 'string')
            ? [req.query.state]
            : req.query.state;

        for (var i = 0; i < inOper.length; i++) {
            inOper[i] = inOper[i].toUpperCase();
        }

        query.state = {'$in': inOper};
    }

    vorTable.find(query, {sort: {call: 1}})
        .success(function(docs) {
            res.send(JSON.stringify(docs));
        });
});

module.exports = router;
