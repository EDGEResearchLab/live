var config = require('../config.json');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('mongodb://' + config.username + config.password + '@' + config.host + ':' + config.port + '/' + config.dbname);
// this is an example get var collection = db.get('flights');

