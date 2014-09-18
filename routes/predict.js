var express = require('express');
var router = express.Router();

var namespace = null;

router.get('/', function(req, res) {
    res.locals = {
        title: 'EDGE Live Prediction'
    };
    res.render('predict');
});

var handleNewPrediction = function(prediction) {
    if (namespace !== null) {
        namespace.emit('prediction', prediction);
    }
};

module.exports = {
    router: router,
    setup: function(app, io) {
        if (namespace === null) {
            namespace = io.of('/predict');
        }

        app.on('prediction', handleNewPrediction);
    }
};
