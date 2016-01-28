/*global define */

define(['db'], function(db) {
  var info = {};
  var alphasArtist = [];
  var alphasAlbum = [];
  var feedArtist;
  var feedAlbum;
  var feedTrack;

  var FEEDS = {
    artist: ['id', 'name'],
    album: ['id', 'title', 'artistId', 'art', 'various'],
    track: ['id', 'title', 'artistId', 'albumId', 'trackno', 'duration'],
  };

  function processTrackData(data) {
    var track;
    var tracks = data;
    var i;
    var artistTracks = {};
    var albumTracks = {};
    var lookup2 = {};
    var indexArtist = FEEDS.track.indexOf('artistId');
    var indexAlbum = FEEDS.track.indexOf('albumId');
    for (i = 0; i < tracks.length; i++) {
      track = tracks[i];
      // artist tracks
      if (artistTracks[track[indexArtist]] === undefined) {
        artistTracks[track[indexArtist]] = [];
      }
      artistTracks[track[indexArtist]].push(track[0]);
      // album tracks
      if (albumTracks[track[indexAlbum]] === undefined) {
        albumTracks[track[indexAlbum]] = [];
      }
      albumTracks[track[indexAlbum]].push(track[0]);
      lookup2[track[0]] = track;
    }
    info.artistTracks = artistTracks;
    info.albumTracks = albumTracks;
    info.tracks = lookup2;
  }


  function processAlbumData(data) {
    var alpha;
    var alphaLast;
    var albums = data;
    var album;
    var artist;
    var albumArtists = [];
    var albumList = [];
    var lookup = {};
    var i;
    var indexArt = FEEDS.album.indexOf('art');
    var indexArtist = FEEDS.album.indexOf('artistId');
    var indexVarious = FEEDS.album.indexOf('various');
    albums.sort(function(a, b) {
      return a[1].toUpperCase() > b[1].toUpperCase() ? 1 : -1;
    });
    for (i = 0; i < albums.length; i++) {
      album = albums[i];
      // fix art
      album[indexArt] = album[indexArt] ? album[0] : 0;
      artist = album[indexArtist];
      if (!album[indexVarious] && albumArtists.indexOf(artist) === -1) {
        albumArtists.push(artist);
      }
      lookup[album[0]] = album;
      albumList.push(album[0]);
      alpha = alphaBit(album[1]);
      if (alpha !== alphaLast) {
        alphaLast = alpha;
        alphasAlbum.push(alpha);
      }
    }
    info.album = lookup;
    info.albumArtists = albumArtists;
    info.albumList = albumList;
  }


  function processArtistData(data) {
    var alpha;
    var alphaLast;
    var artists = data;
    artists.sort(function(a, b) {
      return a[1].toUpperCase() > b[1].toUpperCase() ? 1 : -1;
    });
    // artists = artists.concat(artists);
    var artist;
    var lookup = {};
    var i;
    var artistList = [];
    for (i = 0; i < artists.length; i++) {
      artist = artists[i];
      lookup[artist[0]] = artist;
      artistList.push(artist[0]);
      alpha = alphaBit(artist[1]);
      if (alpha !== alphaLast) {
        alphaLast = alpha;
        alphasArtist.push(alpha);
      }
    }
    info.artist = lookup;
    info.artistList = artistList;
  }


  function alphaBit(value) {
    var alpha = value[0].toUpperCase();
    if (alpha < 'A') {
      alpha = '#';
    }
    return alpha;
  }

  function artist(id) {
    var i;
    var item = info.artist[id];
    var obj;
    if (item) {
      obj = {};
      for (i = 0; i < FEEDS.artist.length; i++) {
        obj[FEEDS.artist[i]] = item[i];
      }
      // helpers
      obj.hasAlbum = function() {
        return (info.albumArtists.indexOf(this.id) !== -1);
      };
      obj.getTracks = function() {
        return info.artistTracks[this.id] || [];
      };
    }
    return obj;
  }

  function album(id) {
    var i;
    var item = info.album[id];
    var obj;
    if (item) {
      obj = {};
      for (i = 0; i < FEEDS.album.length; i++) {
        obj[FEEDS.album[i]] = item[i];
      }
      // helpers
      obj.getTracks = function() {
        return info.albumTracks[this.id] || [];
      };
      obj.getArtistName = function() {
        if (this.various) {
          return 'Various artists';
        } else {
          if (this.artistId === null) {
            return 'FIX ME';
          }
          return artist(this.artistId).name;
        }
      };
    }
    return obj;
  }

  function track(id) {
    var i;
    var item = info.tracks[id];
    var obj;
    if (item) {
      obj = {};
      for (i = 0; i < FEEDS.track.length; i++) {
        obj[FEEDS.track[i]] = item[i];
      }
      // helpers
      obj.getAlbum = function() {
        return album(this.albumId);
      };
      obj.getArtist = function() {
        return artist(this.artistId);
      };
      obj.getIndex = function() {
        return this.title + ' ' + this.getArtist().name + ' ' + this.getAlbum().title;
      };
      obj.getWords = function() {
        return this.getIndex().split(' ').length;
      };
      obj.getArtistName = function() {
        return artist(this.artistId).name;
      };
    }
    return obj;
  }

  function trackList() {
    var t;
    var list = [];
    for (t in info.tracks) {
      if (info.tracks.hasOwnProperty(t)) {
        list.push(t);
      }
    }
    return list;
  }

  function artistList() {
    return info.artistList;
  }


  function albumList() {
    return info.albumList;
  }


  function process(callback) {
    if (!(feedTrack && feedArtist && feedAlbum)) {
      setTimeout(function() {
        process(callback);
      }, 100);
      return;
    }

    processArtistData(feedArtist);
    processAlbumData(feedAlbum);
    processTrackData(feedTrack);
    console.log('processed jukebox data');
    callback();
  }

  function init(callback) {
    db.all('artist', FEEDS.artist, function(result) {
      feedArtist = result;
    });

    db.all('album', FEEDS.album, function(result) {
      feedAlbum = result;
    });

    db.all('track', FEEDS.track, function(result) {
      feedTrack = result;
    });
    process(callback);
  }

  return {
    init: init,

    alphaBit: alphaBit,
    alphasArtist: alphasArtist,
    alphasAlbum: alphasAlbum,

    trackList: trackList,
    artistList: artistList,
    albumList: albumList,

    album: album,
    artist: artist,
    track: track

  };

});
