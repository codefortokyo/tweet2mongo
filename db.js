
var mongodb = require('mongodb');
var shortid = require('shortid');

var config = require('./config');

var db = {};

var client = null;

var retryMax = 10;
var retry = retryMax;

var enter = function(cb) {
  if (client == null) {
    if (retry-- < 0) {
      return cb(new Error('broken DB connection'), null);
    }
    mongodb.MongoClient.connect(
      'mongodb://' + config.dbhost + ':' + config.dbport + '/' + config.dbname,
      function(err, database) {
        if (err != null) {
          return cb(err, null);
        }
        retry = retryMax;
        client = database;
        client.ensureIndex('tweet', {'timestamp_ms': -1}, function() {});
        client.ensureIndex('tweet', 'search_id', function() {});
        client.ensureIndex('search', 'condition', function() {});
        return cb(null, client);
      }
    );
  } else {
    return cb(null, client);
  }
};

db.storeTweet = function(t, s, cb) {
  if (t.timestamp_ms === void 0) {
    t.timestamp_ms = new Date(t.created_at).getTime();
  }
  t.search_id = s._id;
  t._id = t.id_str;
  enter(function (e, c) {
    if (e != null) {
      return cb(e, null);
    }
    c.collection('tweet').update(
      {_id: t._id}, t, {upsert: true}, function(err, doc) {
        if (err != null) {
          client = null;
          return db.storeTweet(t, s, cb);
        }
        return cb(null, doc);
      });
  });
};

var searchLog = function(s) {
  enter(function(e, c) {
    if (e != null) {
      return;
    }
    c.collection('search_log').insert({
      _id: shortid.generate(),
      search_id: s._id,
      timestamp: new Date()
    });
  });
};

db.errorLog = function(error) {
  console.log(new Date() + ': ' + error);
  enter(function(e, c) {
    if (e != null) {
      return;
    }
    c.collection('error_log').insert({
      _id: shortid.generate(),
      error: error,
      timestamp: new Date()
    });
  });
};

db.storeSearch = function(s, cb) {
  enter(function (e, c) {
    if (e != null) {
      return cb(e, null);
    }
    c.collection('search').findOne({condition: s}, function(err, doc) {
      if (err != null) {
        db.errorLog(err);
        client = null;
        return db.storeSearch(s, cb);
      }
      if (doc != null) {
        searchLog(doc);
        return cb(null, doc);
      } else {
        var _doc = {
          _id: shortid.generate(),
          condition: s
        };
        searchLog(_doc);
        return c.collection('search').insert(_doc, function(err, doc) {
          if (err != null) {
            db.errorLog(err);
            client = null;
            return db.storeSearch(s, cb);
          }
          cb(null, doc);
        });
      }
    });
  });
};

db.getTweet = function(cond, ops, cb) {
  enter(function(e, c) {
    if (e != null) {
      return cb(e, null);
    }
    c.collection('tweet').find(cond, ops).toArray(function(err, docs) {
      if (err != null) {
        client = null;
        return db.getTweet(cond, ops, cb);
      }
      return cb(null, docs);
    });
  });
};

db.exit = function() {
  client.close();
};

module.exports = db;
