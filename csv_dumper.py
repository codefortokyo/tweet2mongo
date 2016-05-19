# -*- coding: utf-8 -*-

import sys, json, csv
from datetime import datetime

from shapely.geometry import shape, mapping

import pymongo

def pointify(d):
  if 'coordinates' in d and d['coordinates'] is not None:
    return mapping(shape(d['coordinates']).centroid)['coordinates']
  return mapping(shape(d['place']['bounding_box']).centroid)['coordinates']

def ts2dt(ts):
  return datetime.fromtimestamp(int(ts) / 1000).replace(microsecond=int(ts) % 1000 * 1000)

def map_encode(d):
  return map(lambda x: x.encode('utf-8') if isinstance(x, unicode) else x, d)

if __name__ == '__main__':
  w = csv.writer(sys.stdout, lineterminator='\n')
  w.writerow(['time', 'latitude', 'longitude', 'lang', 'text', 'username'])
  for d in json.loads(sys.stdin.read()):
    p = pointify(d)
    w.writerow(map_encode((ts2dt(d['timestamp_ms']).strftime('%Y-%m-%dT%H:%M:%S.%fZ').replace('000Z','Z'), str(p[1]), str(p[0]), d['lang'], d['text'].replace('\n',''), d['user']['screen_name'])))
