/*global define */

define(function() {

  var path = require('path');
  var fs = require('fs');
  var ffmpeg = require('fluent-ffmpeg');

  function convert(item, callback, data) {
    var file = path.join('converted', item.id + '.ogg');
    fs.exists(file, function(exists) {
      if (exists){
        callback(file, data);
      } else {
        var proc = new ffmpeg({
          source: item.path,
          nolog: true
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
          })
          .saveToFile(file);
      }
    });
  }

  console.log('convert loaded');

  return {
    convert: convert,
  };
});
