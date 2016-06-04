/* global d3 io */

!(function(d3, io) {

  var app = function() {
    var _app = function() {
      var ul = d3.select('body').append('ul');
      var loadmore = d3.select('body').append('div');
      var timestamp_ms = new Date().getTime();
      var loading = null;
      var socket = io();
      var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
      var textify = function(data) {
      //  return JSON.stringify(data);
        return timeFormat(new Date(+data.timestamp_ms)) + ' ' + JSON.stringify(data.coordinates) + ' ' + JSON.stringify(data.place) + ' ' + data.text;
      };
      socket.on('tweet', function(msg) {
        ul.insert('li', 'li').text(textify(msg));
      });

      var maybeFetch = function() {
        if (loadmore.node().getBoundingClientRect().top < document.documentElement.clientHeight + 100)
        {
          if (loading !== null) {
            clearTimeout(loading);
          }
          loading = setTimeout(function() {
            d3.json('/api/tweet?timestamp_ms=' + timestamp_ms, function(err, data) {
              if (err != null) {
                load_more_tweets = null;
                return;
              }
              data.forEach(function(d) {
                ul.append('li').text(textify(d));
              });
              if (data.length == 0) {
                load_more_tweets = null;
                return;
              }
              timestamp_ms = data[data.length-1].timestamp_ms;
              if (loadmore.node().getBoundingClientRect().top < document.documentElement.clientHeight + 100) {
                maybeFetch();
              }
              loading = null;
            });
          }, 200);
        }
      };

      d3.select(window)
        .on('scroll', maybeFetch)
        .on('resize', maybeFetch)
        .each(maybeFetch);

    };
    return _app;
  };
  this.app = app;
}(d3, io));
