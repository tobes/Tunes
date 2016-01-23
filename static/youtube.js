/*global define, gapi */

define(['config'], function(config) {

  var YouTube = require('youtube-node');
  var path = require('path');
  var ytdl = require('ytdl-core');
  var ffmpeg = require('fluent-ffmpeg');

  var youTube = new YouTube();
  youTube.setKey(config.ytApiKey);

  function _downloadYouTubeAudio(id, callback, data){
    var file = path.join('converted', id + '.ogg');
    var ytId = id.split(':')[1];
    var url = 'http://www.youtube.com/watch?v=' + ytId;
    var stream = ytdl(url, {filter:'audioonly'});
    var proc = new ffmpeg({source:stream});
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

  function downloadYouTubeAudio(id, callback){
    var attempt = 0;
    function work(file, data){
      if (file){
        console.log('loaded ' + id);
        console.log(file);
        callback(file, data);
        return;
      }
      if (attempt++ > 5){
        console.log('failed to load ' + id);
        callback(file, data);
        return;
      }
      console.log('download ' + id + ' attempt ' + attempt);
      _downloadYouTubeAudio(id, work, id);
    }
    work();
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
      }
      else {
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
          duration: duration,
          thumb: item.snippet.thumbnails.default.url,
          art: item.snippet.thumbnails.high.url
        };
        callback(out);
      }
    });
  }

  return {
    downloadYouTubeAudio: downloadYouTubeAudio,
    getInfo: getInfo
  };

});
