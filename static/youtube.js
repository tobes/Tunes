/*global define */

define(['config'], function(config) {

  var YouTube = require('youtube-node');
  var path = require('path');
  var ytdl = require('ytdl-core');
  var ffmpeg = require('fluent-ffmpeg');

  var youTube = new YouTube();
  youTube.setKey(config.ytApiKey);

  function downloadAudio(item, callback) {
    var id = item.id;
    var file = path.join('converted', id + '.ogg');
    var ytId = id.split(':')[1];
    var url = 'http://www.youtube.com/watch?v=' + ytId;
    var stream = ytdl(url, {
      filter: 'audioonly'
    });
    var proc = new ffmpeg({
      source: stream
    });
    proc.toFormat('ogg')
      .on('end', function() {
        console.log('file has been converted successfully');
        if (callback) {
          callback(file, id);
        }
      })
      .on('error', function(err) {
        console.log('an error happened: ' + err.message);
        callback(false, id);
      })
      .saveToFile(file);
  }

  function decodeISO8601(str) {
    var parts = str.match(/(\d+)(?=[MHS])/ig) || [];
    var formatted = parts.map(function(item) {
      if (item.length < 2) {
        return '0' + item;
      }
      return item;
    }).join(':');
    return formatted;
  }

  function getInfo(id, callback) {
    var ytid = id.split(':')[1];
    youTube.getById(ytid, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        var duration;
        var out;
        var item = result.items[0];
        duration = decodeISO8601(item.contentDetails.duration);
        out = {
          type: 'youtube',
          type_desc: 'YouTube',
          id: id,
          title: item.snippet.title,
          description: item.snippet.description,
          user: item.snippet.channelTitle,
          duration: duration,
          thumb: item.snippet.thumbnails.default.url,
          art: item.snippet.thumbnails.high.url
        };
        callback(out);
      }
    });
  }

  return {
    downloadAudio: downloadAudio,
    getInfo: getInfo
  };

});
