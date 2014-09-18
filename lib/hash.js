var crypto = require('crypto');

var cache = {};

var hashit = function(string) {
    if (string in cache) {
        return cache[string];
    }

    var md5 = crypto.createHash('md5');
    md5.update(string);
    var hash = md5.digest('hex');
    var limited = hash.substr(hash.length - 6, hash.length);
    console.log(string + ' --> ' + hash + ' --> ' + limited);
    cache[string] = limited;

    return hash;
};

module.exports = {
    hashit: hashit
};
