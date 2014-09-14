var mongo = require('mongodb');
var monk = require('monk');
// this is an example get var collection = db.get('flights');

module.exports = {
    connection: function(opts) {
        return monk('mongodb://' + opts.username + ':' + opts.password + '@' + opts.host + ':' + opts.port + '/' + opts.db);
    }
};
