
var app = require('express')();
var http = require('http').Server(app);

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
});
