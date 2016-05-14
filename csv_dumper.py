# -*- coding: utf-8 -*-

import sys, json, csv

from shapely.geometry import shape, mapping

def pointify(d):
  if 'coordinates' in d and d['coordinates'] is not None:
    return mapping(shape(d['coordinates']).centroid)['coordinates']
  return mapping(shape(d['place']['bounding_box']).centroid)['coordinates']

def map_encode(d):
  return map(lambda x: x.encode('utf-8') if isinstance(x, unicode) else x, d)

if __name__ == '__main__':
  w = csv.writer(sys.stdout, lineterminator='\n')
  w.writerow(['time', 'latitude', 'longitude', 'text', 'username'])
  for d in json.loads(sys.stdin.read()):
    p = pointify(d)
    w.writerow(map_encode((str(d['timestamp_ms']), str(p[1]), str(p[0]), d['text'], d['user']['screen_name'])))
