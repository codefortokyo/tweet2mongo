
var app = require('express')();
var http = require('http').Server(app);
var socketio = require('socket.io')(http);

var config = require('./config');
var t = require('./tweet-searcher');
var db = require('./db');

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

http.listen(config.webui_port, function() {
  console.log('listening on *:' + config.webui_port);
});

socketio.on('connection', function(socket) {
  console.log('a user connected');
});

t.stream(config.stream_filter, function (data) {
  socketio.emit('tweet', data);
  db.storeTweet(data, function(e, r) {});
});

app.get('/api/tweet', function(req, res) {
  var timestamp_ms = req.query.timestamp_ms || new Date().getTime();
  var limit = req.query.limit || 10;
  var skip = req.query.skip || 0;
  db.getTweet({timestamp_ms: {'$lt': ''+timestamp_ms}}, {limit:limit,skip:skip,sort:{'timestamp_ms':-1}}, function(err, data)
  {
    if (err != null)
    {
      return res.status(400).send(e);
    }
    return res.json(data);
  });
});
