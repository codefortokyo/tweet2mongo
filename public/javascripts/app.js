/* global d3 io L */

!(function(d3, io, L) {

  var app = function() {
    var _app = function(_) {
      _.style('width', '960px').style('height', '500px');
      var map = new L.Map(_.node()).setView([0, 0], 1);
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution : '&copy; <a href=\'http://osm.org/copyright\'>OpenStreetMap</a> contributors'
      }).addTo(map);

      var svgLayer = d3.select(map.getPanes().overlayPane).append('svg').attr('class', 'leaflet-zoom-hide');
      var plotLayer = svgLayer.append('g');

      var updatePosition = function(d)
      {
        d.pos = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
        d3.select(this).attr( {cx: d.pos.x, cy: d.pos.y} );
      };

      var updateTextPosition = function(d)
      {
        d.pos = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
        d3.select(this).attr( {x: d.pos.x, y: d.pos.y} );
      };

      function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }

      var transform = d3.geo.transform({point: projectPoint});
      var path = d3.geo.path().projection(transform);
      var socket = io();

      socket.on('tweet', function(msg) {
        if (msg.place !== void 0) {
          var g = plotLayer.append('g').datum(msg).attr('opacity',1.0);

/*          g.append('path').datum(msg.place.bounding_box)
            .attr('d', path)
            .attr('fill', 'rgba(0,0,0,0.5)');*/
          g.append('circle').datum(d3.geo.centroid(msg.place.bounding_box)).attr({r:8, fill:'steelblue', stroke: 'white', 'stroke-width': 0.5}).each(updatePosition);
          g.append('text').datum(d3.geo.centroid(msg.place.bounding_box)).attr({fill:'#000'}).text(msg.text).each(updateTextPosition);
//          g.transition().delay(3000).duration(2000).attr('opacity',0.0).transition().remove();
        }
      });

      var reset = function()
      {
        var bounds = map.getBounds();
        var topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
        var bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

        svgLayer.attr('width', bottomRight.x - topLeft.x)
          .attr('height', bottomRight.y - topLeft.y)
          .style('left', topLeft.x + 'px')
          .style('top', topLeft.y + 'px');

        plotLayer.attr('transform', 'translate('+ -topLeft.x + ',' + -topLeft.y + ')');
        plotLayer.selectAll('path').attr('d', path);
        plotLayer.selectAll('circle').each(updatePosition);
        plotLayer.selectAll('text').each(updateTextPosition);
      };

      map.on('move', reset);
      reset();
      /*
      var ul = _.append('ul');
      var data = [];


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
      */

    };
    return _app;
  };
  this.app = app;
}(d3, io, L));
