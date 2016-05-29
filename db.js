
var mongodb = require('mongodb');
var shortid = require('shortid');

var config = require('./config');

var db = {};

var client = null;

var enter = function(cb) {
  if (client == null) {
    mongodb.MongoClient.connect(
      'mongodb://' + config.dbhost + ':' + config.dbport + '/' + config.dbname,
      function(err, database) {
        if (err != null) {
          return cb(err, null);
        }
        client = database;
        client.ensureIndex('tweet', {'timestamp_ms': -1}, function(e, i) {});
        client.ensureIndex('tweet', 'search_id', function(e, i) {});
        client.ensureIndex('search', 'condition', function(e, i) {});
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
    c.collection('tweet').update({_id: t._id}, t, {upsert: true}, cb);
  });
}

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
}

db.errorLog = function(error) {
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
}

db.storeSearch = function(s, cb) {
  enter(function (e, c) {
    c.collection('search').findOne({condition: s}, function(e, doc) {
      if (e != null) {
        return cb(e, null);
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
        return c.collection('search').insert(_doc, cb);
      }
    });
  });
}

db.getTweet = function(cond, ops, cb) {
  enter(function(e, c) {
    if (e != null) {
      return cb(e, null);
    }
    c.collection('tweet').find(cond, ops).toArray(cb);
  });
}

module.exports = db;
