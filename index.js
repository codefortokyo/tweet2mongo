
var twitter = require('twitter');

var config = require('./config');

var t = new twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

var option = {'track': config.track_word};

t.stream('statuses/filter', option, function(stream) {
  stream.on('data', function (data) {
    console.log(data);
  });
});
