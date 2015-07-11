/*global define */

define(['db', 'config'], function(db, config) {

  var fs = require('fs');
  var path = require('path');
  var mm = require('musicmetadata');


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
        var various = (info.artist.toLowerCase() === 'various');
        db.addOrId('album', {
            path: dir,
            art: art,
            title: info.album,
            artist: info.artist,
            artistId: artistId,
            pathArtist: info.artist,
            pathAlbum: info.album,
            various: various,
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


  function readId3(callback) {
    db.all('track', null, function(result) {
      var i = 0;
      var id3 = [];

      function next() {
        var track = result[i];
        if (!track) {
          callback(id3);
          return;

        }
        if (track.id3) {
          i++;
          next();
        } else {
          var parser = mm(fs.createReadStream(result[i].path), {
            duration: true
          }, function(err, metadata) {
            if (err) throw err;
            id3.push({
              track: result[i],
              id3: metadata
            });
            console.log('id3: ' + i + ' - ' + metadata.artist[0]);
            i++;
            next();
          });
        }
      }
      next();
    });
  }

  function processId3(data) {
    var artistId;
    var info;
    var i = 0;
    var updated;
    var artist;
    var title;
    var trackNo;
    var album;
    var duration;
    var genre;
    var year;

    function work() {
      info = data[i];
      if (!info) {
        console.log('Id3 scan complete!')
        return;
      }


      title = info.id3.title || info.track.basename;
      album = info.id3.album || info.track.pathAlbum;
      artist = info.id3.artist[0] || info.track.pathArtist;
      trackNo = info.id3.track.no;
      duration = info.id3.duration;
      year = info.id3.year;
      genre = info.id3.genre.join('|');

      if (artistId === undefined) {
        db.addOrId('artist', {
            name: info.id3.artist[0],
          },
          'name',
          function(id) {
            artistId = id;
            work();
          });
      } else {
        console.log(i + ' track: ' + title);
        updated = info.track;
        updated.artistId = artistId;
        updated.artist = artist;
        updated.title = title;
        updated.trackno = trackNo;
        updated.album = album;
        updated.duration = duration;
        updated.genre = genre;
        updated.year = year;
        updated.id3 = true;

        artistId = undefined;
        i++;

        db.put('track', updated, work);
      }
    }
    work();

  }


  console.log('import loaded');

  return {
    walk: walk
  };

});
