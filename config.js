
'use strict';

var config = {
  'twitter_consumer_key': process.env['TWITTER_CONSUMER_KEY'],
  'twitter_consumer_secret': process.env['TWITTER_CONSUMER_SECRET'],
  'twitter_access_token_key': process.env['TWITTER_ACCESS_TOKEN_KEY'],
  'twitter_access_token_secret': process.env['TWITTER_ACCESS_TOKEN_SECRET'],
  'track_word': process.env['TWEET_STREAM_TRACK_WORD'],
  'dbname': process.env['TWEET_STREAM_DBNAME'],
  'dbport': process.env['TWEET_STREAM_DBPORT']
};

try
{
  var f = require('./.config.json');
  Object.keys(f).forEach(function(d)
  {
    config[d] = f[d];
  });
}
catch (e)
{
  'pass';
}
module.exports = config;
