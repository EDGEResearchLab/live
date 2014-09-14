var mongojs = require('mongojs');
// this is an example get var collection = db.get('flights');

function DBConnection(opts) {
    if (!(this instanceof DBConnection)) {
        return new DBConnection(opts);
    }

    this.db = mongojs('mongodb://' + opts.username + ':' + opts.password + '@' + opts.host + ':' + opts.port + '/' + opts.db);
}

DBConnection.prototype.flights = function(query, callback) {
    var flights = this.db.collection('flights');
    return flights.find(query, callback);
};

module.exports = {
    connection: DBConnection
};
