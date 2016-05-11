
var twitter = require('twitter');

var twit = new twitter({
  consumer_key: 'xx',
  consumer_secret: 'xx',
  access_token_key: 'xx',
  access_token_secret: 'xx'
});

var keyword = process.argv[2];

var option = {'track': keyword};

twit.stream('statuses/filter', option, function(stream) {
  stream.on('data', function (data) {
    console.log(data);
  });
});
