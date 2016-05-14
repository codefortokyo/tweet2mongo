
var app = require('express')();
var http = require('http').Server(app);
var socketio = require('socket.io')(http);

var twitter = require('twitter');
var mongodb = require('mongodb');
var shortid = require('shortid');

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

    app.get('/', function(req, res) {
      res.sendfile('index.html');
    });

    app.get('/api/tweet', function(req, res) {
      var timestamp_ms = req.query.timestamp_ms || new Date().getTime();
      var limit = req.query.limit || 10;
      var skip = req.query.skip || 0;
      coll.find({timestamp_ms: {'$lt': ''+timestamp_ms}}, {limit:limit,skip:skip,sort:{'timestamp_ms':-1}}).toArray(function(err, data)
      {
        if (err != null)
        {
          return res.status(400).send(e);
        }
        return res.json(data);
      });
    });

    app.get('/api/geotweet', function(req, res) {
      var timestamp_ms = req.query.timestamp_ms || new Date().getTime();
      var limit = req.query.limit || 10;
      var skip = req.query.skip || 0;
      coll.find({'$and': [{timestamp_ms: {'$lt': ''+timestamp_ms}}, {'$or': [{place: {'$ne': null}}, {coordinates: {'$ne': null}}]}]}, {limit:limit,skip:skip,sort:{'timestamp_ms':-1}}).toArray(function(err, data)
      {
        if (err != null)
        {
          return res.status(400).send(err);
        }
        return res.json(data);
      });
    });

    socketio.on('connection', function(socket) {
      console.log('a user connected');
    });

    http.listen(config.webui_port, function() {
      console.log('listening on *:' + config.webui_port);
    });
    t.stream('statuses/filter', {'track': config.track_word}, function(stream) {
      stream.on('data', function (data) {
        data['_id'] = shortid.generate();
        coll.save(data);
        socketio.emit('tweet', data);
      });
    });
  });
});
