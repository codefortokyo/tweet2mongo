
var twitter = require('twitter');

var db = require('./db');
var config = require('./config');

var client = new twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});


var t = {};
var retry = 100;

t.stream = function(cond, onData) {
  db.storeSearch(cond, function(e, d) {
    client.stream('statuses/filter', cond, function(stream) {
      stream.on('data', onData);
      stream.on('error', function(err) {
        db.errorLog(err);
        setTimeout(function() {
          t.stream(cond, onData);
        }, retry);
        retry *= 2;
      });
    });
  });
}

module.exports = t;
