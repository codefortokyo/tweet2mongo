
var twitter = require('twitter');
var mongodb = require('mongodb');

var config = require('./config');

var t = new twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

mongodb.MongoClient.connect('mongodb://' + config.dbhost + ':' + config.dbport + '/' + config.dbname, function(err, database) {
  var coll = database.collection('tweet');
  coll.ensureIndex('timestamp_ms', function(err, i) {
    t.stream('statuses/filter', {'track': config.track_word}, function(stream) {
      stream.on('data', function (data) {
        coll.save(data);
        console.log(data);
      });
    });
  });
});
