var express = require('express');
var router = express.Router();

var db = require('../db');

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/api/tweet', function(req, res) {
  var timestamp_ms = req.query.timestamp_ms || new Date().getTime();
  var limit = req.query.limit || 10;
  var skip = req.query.skip || 0;
  db.getTweet(
    {timestamp_ms: {'$lt': ''+timestamp_ms}},
    {limit:limit,skip:skip,sort:{'timestamp_ms':-1}},
    function(err, data) {
      if (err != null) {
        return res.status(400).send(err);
      }
      return res.json(data);
    }
  );
});

module.exports = router;
