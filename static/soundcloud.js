/*global define */

define(['config'], function(config) {

  var https = require('https');
  var SC = require('node-soundcloud');
  var path = require('path');
  var ffmpeg = require('fluent-ffmpeg');
  var Readable = require('stream').Readable;

  SC.init({
    id: config.soundcloudApiKey
  });

  function convert(file, stream, callback, data) {
    var proc = new ffmpeg({
      source: stream
    });
    proc.toFormat('ogg')
      .on('end', function() {
        console.log('file has been converted successfully');
        if (callback) {
          callback(file, data);
        }
      })
      .on('error', function(err) {
        console.log('an error happened: ' + err.message);
        callback(false, data);
      })
      .saveToFile(file);
  }

  function downloadAudio(item, callback) {
    var id = item.id;
    var file = path.join('converted', id + '.ogg');
    var stream = new Readable();
    var src = item.source + '?client_id=' + config.soundcloudApiKey;
    https.get(src, function(res) {
      https.get(res.headers.location, function(res) {
        res.on('data', function(chunk) {
          stream.push(chunk);
        });
        res.on('end', function() {
          stream.push(null);
          convert(file, stream, callback, id);
        });
      });
    });
  }

  function ms2time(ms) {
    var seconds = (ms / 1000) % 60 << 0;
    var minutes = (ms / 1000 / 60) << 0;
    var hours = (ms / 1000 / 60 / 60) << 0;

    var parts = hours ? [hours, minutes, seconds] : [minutes, seconds];
    var formatted = parts.map(function(item) {
      if (item < 10) {
        return '0' + item;
      }
      return item;
    }).join(':');
    return formatted;
  }

  function largeImg(url) {
    if (url) {
      return url.replace('large.', 't500x500.');
    }
  }

  function getInfo(id, callback) {
    var scid = id.split(':')[1];
    SC.get('/tracks/' + scid, function(err, track) {
      if (err) {
        throw err;
      }
      console.log('track retrieved:', track);
      var out;
      out = {
        type: 'soundcloud',
        type_desc: 'SoundCloud',
        id: id,
        source: track.stream_url,
        title: track.title,
        description: track.description,
        duration: ms2time(track.duration),
        user: track.user.username,
        thumb: track.artwork_url || track.user.avatar_url,
        art: largeImg(track.artwork_url) || track.user.avatar_url

      };
      callback(out);
    });
  }


  return {
    downloadAudio: downloadAudio,
    getInfo: getInfo
  };

});
