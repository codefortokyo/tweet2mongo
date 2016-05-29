
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
  db.storeSearch(cond, function(e, search) {
    client.stream('statuses/filter', cond, function(stream) {
      stream.on('data', function(data) {
        db.storeTweet(data, search, function(e, r){});
        return onData(data);
      });
      stream.on('error', function(err) {
        if (err.code !== void 0) {
          db.errorLog(err);
        }
      });
    });
  });
}

module.exports = t;
