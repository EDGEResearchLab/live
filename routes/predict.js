var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    res.locals = {
        title: 'EDGE Live'
    }
    res.render('predict');
});


module.exports = {
    router: router
};
