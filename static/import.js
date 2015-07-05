/*global define */

define(['db', 'config'], function(db, config) {

  var fs = require('fs');
  var path = require('path');


  function getDirs(dir, callback) {
    dir = path.normalize(dir);
    results = [];
    var walk = function(dir, done) {
      fs.readdir(dir, function(err, list) {
        if (err) {
          return done(err);
        }
        var i = 0;

        function next() {
          var file = list[i++];
          if (!file) {
            return done(null);
          }
          file = path.join(dir, file);
          fs.stat(file, function(err, stat) {
            if (stat && stat.isDirectory()) {
              results.push(file);
              walk(file, function(err, res) {
                next();
              }, config.importLimiter);
            } else {
              next();
            }
          });
        }
        next();
      });
    }

    walk(dir, function(err) {
      if (err) {
        console.log('import errors:', err);
      } else {
        callback(results);
      }
    });
  }


  function processDir(dir, callforward, callback) {
    var files = [];

    var walk = function(dir, done) {
      fs.readdir(dir, function(err, list) {
        if (err) {
          console.log(err);
          return done(err);
        }
        var i = 0;

        function next() {
          var file = list[i++];
          if (!file) {
            return done();
          }
          file = path.join(dir, file);
          fs.stat(file, function(err, stat) {
            if (stat && !stat.isDirectory()) {
              files.push(file);
            }
            next();
          });
        }
        next();
      });
    }

    walk(dir, function(err) {
      if (err) {
        console.log('import errors:', err);
      } else {
        callforward(dir, files, callback);
      }
    });
  }


  function dirInfo(dir) {
    var dirParts = dir.split(path.sep);
    var pathAlbum;
    var pathArtist;
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
    return {
      artist: pathArtist,
      album: pathAlbum,
    };
  }


  function processFileList(dir, files, callback) {
    var audio = [];
    var covers = [];
    var i;

    var info = dirInfo(dir);

    for (i = 0; i < files.length; i++) {
      var file = files[i];
      var ext = path.extname(file);
      if (config.importAudioExtensions.indexOf(ext) > -1) {
        audio.push(file);
      } else if (config.importImageExtensions.indexOf(ext) > -1) {
        covers.push(file);
      }
    }

    if (!audio.length) {
      callback();
    } else {
      console.log('Importing:', info.artist, info.album);
      var cover = '';
      var art = false;
      if (covers.length) {
        cover = covers[0];
        art = true
      }
      var setTracks = function(albumId, artistId, art) {
        var trackIndex = 0;
        var next = function() {
          file = audio[trackIndex++];
          if (!file) {
            return callback();
          }
          var ext = path.extname(file);
          var basename = path.basename(file, ext);
          db.add('track', {
            path: file,
            dirname: dir,
            basename: basename,
            artistId: artistId,
            albumId: albumId,
            art: art,
            pathArtist: info.artist,
            pathAlbum: info.album,
            title: basename,
            artist: info.artist,
            album: info.album,
          }, next);
        }
        next()
      }

      var setAlbum = function(artistId) {
        db.addOrId('album', {
            path: dir,
            art: art,
            title: info.album,
            artist: info.artist,
            artistId: artistId,
            pathArtist: info.artist,
            pathAlbum: info.album,
            various: false,
          },
          'path',
          function(albumId) {
            var coverExt = path.extname(cover);
            fs.createReadStream(cover).pipe(fs.createWriteStream(path.join('covers', albumId.toString())));

            setTracks(albumId, artistId, art)
          });
      }

      db.addOrId('artist', {
          name: info.artist,
        },
        'name',
        function(artistId) {
          //console.log('artistId', artistId);
          setAlbum(artistId)
        });

    }
  }


  function processDirs(results) {
    var i = 0;
    var next = function() {
      var dir = results[i++];
      if (!dir) {
        console.log('finished import');
        return;
      }
      processDir(dir, processFileList, function() {
        next()
      });
    }
    next()
  }


  console.log('import loaded');

  return {
    walk: walk
  };

});
