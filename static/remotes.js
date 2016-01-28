/*global define */

define(['youtube', 'soundcloud'], function(youtube, soundcloud) {

  const path = require('path');
  const fs = require('fs');

  function getInfo(id, callback) {
    if (/^YT:/.test(id)) {
      youtube.getInfo(id, callback);
    }
    if (/^SC:/.test(id)) {
      soundcloud.getInfo(id, callback);
    }
  }

  function downloadAudio(item, callback) {
    var attempt = 0;
    var id = item.id;

    function work(file, data) {
      if (file) {
        console.log('loaded ' + item.id);
        console.log(file);
        callback(file, data);
        return;
      }
      if (attempt++ > 5) {
        console.log('failed to load ' + item.id);
        callback(file, data);
        return;
      }
      console.log('download ' + item.id + ' attempt ' + attempt);
      if (/^YT:/.test(id)) {
        youtube.downloadAudio(item, work);
      }
      if (/^SC:/.test(id)) {
        soundcloud.downloadAudio(item, work);
      }
    }

    var file = path.join('converted', id + '.ogg');
    fs.exists(file, function (exists){
      if (exists){
        callback(file, id);
      } else {
        work();
      }
    });

  }

  return {
    downloadAudio: downloadAudio,
    getInfo: getInfo
  };

});
