/* global d3 io L Ps */

!(function(d3, io, L, Ps) {

  var app = function() {
    var _data = function() {
      var dispatcher = d3.dispatch('prepended', 'appended');
      var list = [];
      var socket = io();
      var loading = false;
      var timer = null;
      var lastTimestamp = (new Date()).getTime();

      socket.on('tweet', function(msg) {
        list.unshift(msg);
        dispatcher.prepended(msg);
      });
      d3.rebind(this, dispatcher, 'on');

      this.load = function() {
        if (loading) {
          return;
        }
        if (timer != null) {
          clearTimeout(timer);
        }
        timer = setTimeout(function() {
          loading = true;
          d3.json('/api/tweet?timestamp_ms=' + lastTimestamp, function(error, data) {
            if (error != null) {
              throw error;
            }
            Array.prototype.push.apply(list, data);
            lastTimestamp = data[data.length - 1].timestamp_ms;
            loading = false;
            timer = null;
            dispatcher.appended(data);
          });
        }, 200);
      };

      this.get = function() {
        return list;
      };

      return this;
    };
    var _map = function(root, data) {
      var viewCenter = [0, 0];
      var viewZoom = 1;
      var map = new L.Map(root.node()).setView(viewCenter, viewZoom);
      var that = this;

      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution : '&copy; <a href=\'http://osm.org/copyright\'>OpenStreetMap</a> contributors'
      }).addTo(map);
      function projectPoint(x, y) {
        if (y === void 0) {return projectPoint(x[0], x[1]);}
        return map.latLngToLayerPoint(new L.LatLng(y, x));
      }
      function projectStream(x, y) {
        var point = projectPoint(x, y);
        this.stream.point(point.x, point.y);
      }

      var transform = d3.geo.transform({point: projectStream});
      var path = d3.geo.path().projection(transform);
      var svgLayer = d3.select(map.getPanes().overlayPane).append('svg').attr('class', 'leaflet-zoom-hide');
      var pathLayer = svgLayer.append('g');
      var plotLayer = svgLayer.append('g');
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
        plotLayer.selectAll('circle')
          .each(function(d) {
            d.xy = projectPoint(d.coord);
            d3.select(this).attr({cx: d.xy.x, cy: d.xy.y});
          });
      };

      this.setView = function(coord, zoom) {
        map.setView(coord, zoom);
      };

      this.plotPoint = function(d) {
        d.xy = projectPoint(d.coord);
        plotLayer.append('circle').datum(d)
          .attr({fill: 'steelblue', stroke: 'white', 'stroke-width': 2, r: 4, cx: d.xy.x, cy: d.xy.y, opacity: 0.8});
        plotLayer.append('circle').datum(d)
          .attr({fill: 'steelblue', r: 4, cx: d.xy.x, cy: d.xy.y, opacity: 0.8})
          .transition().ease('linear').attr({r: 20, opacity: 0.0}).remove();
      };

      this.renderFeature = function(f) {
        var p = pathLayer.append('path').datum(f);
        p.attr('class', 'map-path')
          .attr('d', path);
      };

      this.renderFeatureCollection = function(fc) {
        var that = this;
        fc.features.forEach(function(d) {
          that.renderFeature(d);
        });
      };

      data.on('prepended.map', function(msg) {
        if (msg.place == null) {return;}
        if (msg.coordinates != null) {
          msg.coord = d3.geo.centroid(msg.coordinates);
        } else {
          msg.coord = d3.geo.centroid(msg.place.bounding_box);
        }
        that.plotPoint(msg);
      });
      data.on('appended.map', function(msgs) {
        msgs.forEach(function(msg) {
          if (msg.place == null) {return;}
          if (msg.coordinates != null) {
            msg.coord = d3.geo.centroid(msg.coordinates);
          } else {
            msg.coord = d3.geo.centroid(msg.place.bounding_box);
          }
          that.plotPoint(msg);
        });
      });
      map.on('move', reset);
      reset();
    };

    var _tl = function(root, data) {
      Ps.initialize(root.node(), {
        suppressScrollX: true
      });
      root.style('overflow', 'hidden').style('position', 'relative')
        .on('ps-y-reach-end', function(){data.load();});
      var ul = root.append('ul');
      var renderItem = function() {
        var s = d3.select(this);
        var head = s.append('div').attr('class', 'clearfix')
          .style('border-bottom', 'solid 1px #CCC');
        head.append('span').style('float', 'left').style('margin-left', '4px')
          .text(function(d) {return d.user.screen_name;});
        head.append('span').style('float', 'right').style('margin-right', '4px')
          .text(function(d) {return d.created_at;});
        var body = s.append('div');
        body.text(function(d) {return d.text;}).style('margin', '0 12px');
      };
      data.on('prepended.timeline', function(msg) {
        ul.insert('li', 'li').datum(msg)
          .each(renderItem);
        Ps.update(root.node());
      });
      data.on('appended.timeline', function(msgs) {
        msgs.forEach(function(d) {
          ul.append('li').datum(d)
            .each(renderItem);
        });
        Ps.update(root.node());
      });
    };

    var _app = function(_) {
      _.style('width', '960px').style('height', '500px').attr('class', 'clearfix');
      var data = _data();
      data.load();
      _map(_.append('div').style('width', '500px').style('height', '500px').style('float', 'left'), data);
      _tl(_.append('div').style('width', '460px').style('height', '500px').style('float', 'right').attr('class', 'clearfix'), data);
    };
    return _app;
  };
  this.app = app;
}(d3, io, L, Ps));
