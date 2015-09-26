/*global define */

define(['db', 'config'], function(db, config) {

  var fs = require('fs');
  var path = require('path');
  var mm = require('musicmetadata');
  var Jimp = require("jimp");


  function getDirs(dir, callback) {
    dir = path.normalize(dir);
    var results = [];
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
    };

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
    };

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
        art = true;
      }
      var artistId;
      var albumId;
      var tracks;
      var artSaved;

      var work = function() {
        if (!artistId) {
          db.addOrId('artist', {
              name: info.artist,
            },
            'name',
            function(id) {
              artistId = id;
              work();
            });
        }

        if (artistId && !albumId) {
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
            function(id) {
              albumId = id;
              work();
            });
        }

        if (albumId && !artSaved) {
          if (art) {
            var pathCover = path.join('covers', albumId.toString());
            var thumb = new Jimp(cover, function(err, image) {
              this.write(pathCover + '.png');
              this.resize(128, 128).write(pathCover + 'T.png');
            });
          }
          artSaved = true;
          work();
        }

        if (artSaved && !tracks) {
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
          };
          tracks = true;
          next();
        }
      };
      work();
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
      console.log(i + ' of ' + results.length);
      processDir(dir, processFileList, function() {
        next();
      });
    };
    next();
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
            if (err) {
              console.log(err);
            } else {
              id3.push({
                track: result[i],
                id3: metadata
              });
            }
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
        albumFix();
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

  function albumTrackSort(a, b) {
    return (a.trackno > b.trackno ? 1 : -1);
  }


  function albumFix(){
    var trackList;
    var albums = {};
    if (trackList === undefined){
      db.all('track', null, function(result) {
        var i;
        var album;
        var albumData;
        var track;
        var tracks;
        var checkArtist;
        var checkAlbum;
        trackList = result;
        for (i = 0; i < trackList.length; i++){
          track = trackList[i];
          if (albums[track.albumId] === undefined){
            albums[track.albumId] = [];
          }
          albums[track.albumId].push(track);
        }
        for (album in albums){
          if (albums.hasOwnProperty(album)){
            albumData = albums[album].sort(albumTrackSort);
            tracks = [albumData[0].id];
            checkArtist = albumData[0].artistId;
            checkAlbum = albumData[0].album;
            for (i = 1; i < albumData.length; i++){
              tracks.push(albumData[i].id);
              if (albumData[i].artistId !== checkArtist){
                checkArtist = undefined;
              }
              if (checkAlbum && albumData[i].album.toLowerCase() !== checkAlbum.toLowerCase()){
                checkAlbum = undefined;
              }
            }
            albums[album] = {various: (checkArtist === undefined)};
            if (checkAlbum !== undefined){
              albums[album].title = checkAlbum;
            }
            if (checkArtist !== undefined){
              albums[album].artistId = checkArtist;
            }
            albums[album].tracks = tracks;
          }
        }
        db.all('artist', null, function(result) {
          var artists = {};
          var i;
          for (i =0; i < result.length; i++){
            artists[result[i].id] = result[i].name;
          }
          console.log(artists);
          db.all('album', null, function(result) {
            i = 0;
            function work() {
              var alb = result[i++];
              if (alb === undefined){
                return;
              }
              var trackString = albums[alb.id].tracks.join(',');
              var albTitle = albums[alb.id].title;
              var albArtistId = albums[alb.id].artistId;
              var updateTitle = (albTitle && alb.title !== albTitle);
              var updateArtistId = albArtistId !== alb.artistId;
              var updateArtist = artists[albArtistId] !== alb.artist;
              var updateTracks = trackString !== alb.tracks;
              console.log(artists[albArtistId]);
              if (updateTracks || updateArtist || updateTitle || updateArtistId){
                if (updateTitle){
                  alb.title = albTitle;
                }
                if (updateArtistId){
                  alb.artistId = albArtistId;
                }
                if (updateArtist){
                  alb.artist = artists[albArtistId];
                }
                if (updateTracks){
                  alb.tracks = trackString;
                }
                db.put('album', alb, work);
                console.log(alb.title);
              } else {
                work();
              }
            }
            work();
          });
        });
      });
    }
  }

  function scanId3() {
    readId3(processId3);
    console.log('Id3 scan complete!');
  }

  // scanId3();
  // create a new parser from a node ReadStream
  // getDirs('/home/toby/Albums/', processDirs);

  console.log('import loaded');

  return {
//    walk: walk
  };

});
