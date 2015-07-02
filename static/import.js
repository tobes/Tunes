/*global define */

define(['db'], function(db) {

  var fs = require('fs');
  var path = require('path');

  var extensions = ['.mp3', '.flac', '.ogg', '.wav'];


  var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if (err) {
        return done(err);
      }
      var i = 0;
      (function next() {
        var file = list[i++];
        if (!file) {
          return done(null, results);
        }
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file, function(err, res) {
              // results = results.concat(res);
              next();
            });
          } else {
            //results.push(file);
            file = path.normalize(file);
            var ext = path.extname(file);
            if (ext && extensions.indexOf(ext.toLowerCase()) >= 0) {
              var dirname = path.dirname(file);
              var dirParts = dirname.split(path.sep);
              var pathAlbum, pathArtist;
              var parts = dirParts.length;
              if (parts > 0) {
                pathAlbum = dirParts[parts - 1];
              } else {
                pathAlbum = '';
              }
              if (parts > 1) {
                pathArtist = dirParts[parts - 2];
              } else {
                pathArtist = '';
              }

              var basename = path.basename(file, ext);

              db.addTrack({
                path: file,
                dirname: dirname,
                basename: basename,
                pathArtist: pathArtist,
                pathAlbum: pathAlbum
              });
            }
            next();
          }
        });
      }());
    });
  };


  console.log('import loaded');

  return {
    walk: walk
  };

});
