
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
var retryMax = 10;
var retry = retryMax;

t.stream = function(cond, onData) {
  if (retry-- < 0) {
    throw new Error('can\'t establish twitter connection.');
  }
  db.storeSearch(cond, function(e, search) {
    client.stream('statuses/filter', cond, function(stream) {
      retry = retryMax;
      stream.on('data', function(data) {
        db.storeTweet(data, search, function(e, r){});
        return onData(data);
      });
      stream.on('error', function(err) {
        if (err.code !== void 0) {
          db.errorLog(err);
          try {
            stream.destroy();
          } catch(e) {
            db.errorLog(e);
          }
          setTimeout(function() {
            t.stream(cond, onData);
          }, 1000);
        }
      });
    });
  });
}

module.exports = t;
