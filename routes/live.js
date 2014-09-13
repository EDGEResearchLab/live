var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    console.log('app: ' + req.app);
    res.render('live', {
        title: 'EDGE Live'
    });
});

module.exports = router;
