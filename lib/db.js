var mongojs = require('mongojs');
var Promise = require('bluebird');

function DBConnection(opts) {
    if (!(this instanceof DBConnection)) {
        return new DBConnection(opts);
    }

    this.db = mongojs('mongodb://' + opts.username + ':' + opts.password + '@' + opts.host + ':' + opts.port + '/' + opts.db);
}

DBConnection.prototype.getFlights = function(query, projection) {
    return this.makeQuery('flights', query, projection);
};

DBConnection.prototype.saveFlight = function(doc) {
    return this.saveDocs('flights', doc);    
};

DBConnection.prototype.getVors = function(query, projection) {
    return this.makeQuery('vors', query, projection);
};

DBConnection.prototype.getTracks = function(query, projection) {
    return this.makeQuery('trackers', query, projection);
};

DBConnection.prototype.saveTrack = function(doc) {
    return this.saveDocs('trackers', doc);
};

DBConnection.prototype.aggregateTracks = function(aggregation) {
    return this.aggregate('trackers', aggregation);
};

DBConnection.prototype.aggregate = function(collectionName, aggregation) {
    var deferred = Promise.pending();

    var collection = this.db.collection(collectionName);
    collection.aggregate(aggregation, function(err, docs) {
        if (err) {
            deferred.reject(err);
            return;
        }
        deferred.resolve(docs);
    });

    return deferred.promise;
};

DBConnection.prototype.saveDocs = function(collectionName, docOrDocs) {
    var deferred = Promise.pending();

    var collection = this.db.collection(collectionName);
    collection.save(docOrDocs, function(err, doc) {
        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve(doc);
    });

    return deferred.promise;
};

DBConnection.prototype.makeQuery = function(collectionName, query, projection) {
    var deferred = Promise.pending();
    query = query || {};
    projection = projection || {};

    var collection = this.db.collection(collectionName);
    collection.find(query, projection, function(err, docs) {
        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve(docs);
    });

    return deferred.promise;
};

module.exports = {
    connection: DBConnection
};
