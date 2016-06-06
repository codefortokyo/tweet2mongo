
var twitter = require('twitter');
var bigInt = require('big-integer');

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
var rateLimit = null;


var renewRateLimit = function(cb) {
  if (rateLimit == null || (rateLimit.reset*1000) < new Date().getTime()) {
    client.get('application/rate_limit_status', {resources: 'search'}, function(error, tweets) {
      console.log('GET!!');
      if (error != null) {
        db.errorLog(error);
        return cb(error, null);
      }
      rateLimit = tweets.resources.search['/search/tweets'];
      cb(null, rateLimit);
    });
  } else {
    cb(null, rateLimit);
  }
};


t.search = function(cond) {
  renewRateLimit(function(e, r) {
    if (e != null) {
      db.errorLog(e);
      throw e;
    }
    console.log(r);
    if (r.remaining <= 2) {
      return setTimeout(function() {
        return t.search(cond);
      }, (r.reset * 1000) - new Date().getTime() + 200);
    }
    r.remaining--;
    if (cond.count === void 0) {
      cond.count = 100;
    }
    db.storeSearch(cond, 'search', function(e, search) {
      client.get('search/tweets', cond, function(error, tweets) {
        if (error != null) {
          db.errorLog(error);
          throw error;
        }
        if (tweets.statuses.length === 0) {
          return;
        }
        tweets.statuses.forEach(function(d) {
          db.storeTweet(d, search, function(e) {
            if (e != null) {
              throw e;
            }
          });
        });
        var ids = tweets.statuses.map(function(d) {return d.id_str;}).sort();
        console.log([ids[0], ids[ids.length - 1]]);
        var _cond = {};
        Object.keys(cond).forEach(function(k) {
          _cond[k] = cond[k];
        });
        _cond.max_id = bigInt(ids[0]).add(-1).toString();
        t.search(_cond);
      });
    });
  });
};

t.stream = function(cond, onData) {
  if (retry-- < 0) {
    throw new Error('can\'t establish twitter connection.');
  }
  db.storeSearch(cond, 'stream', function(e, search) {
    client.stream('statuses/filter', cond, function(stream) {
      retry = retryMax;
      stream.on('data', function(data) {
        db.storeTweet(data, search, function(e) {
          if (e != null) {
            throw e;
          }
          return onData(data);
        });
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
};


module.exports = t;
