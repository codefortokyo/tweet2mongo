
var app = require('express')();
var http = require('http').Server(app);
var socketio = require('socket.io')(http);

var twitter = require('twitter');
var mongodb = require('mongodb');
var shortid = require('shortid');

var config = require('./config');

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

socketio.on('connection', function(socket) {
  console.log('a user connected');
});

http.listen(config.webui_port, function() {
  console.log('listening on *:' + config.webui_port);
});

var t = new twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

mongodb.MongoClient.connect('mongodb://' + config.dbhost + ':' + config.dbport + '/' + config.dbname, function(err, database) {
  var coll = database.collection('tweet');
  coll.ensureIndex('timestamp_ms', function(err, i) {
/*
    t.stream('statuses/filter', {'track': config.track_word}, function(stream) {
      stream.on('data', function (data) {
        data['_id'] = shortid.generate();
        coll.save(data);
      });
    });
*/
  
  });
});
