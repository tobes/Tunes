/*global define */

define(function() {

  var info = {};
  var alphasArtist = [];
  var alphasAlbum = [];
  var queue = [];
  var feedData = {};
  var config = {};

  function processTrackData(data) {
    var track;
    var tracks = data.track;
    var i;
    var artistTracks = {};
    var albumTracks = {};
    var lookup2 = {};
    var indexArtist = data.feed.track.indexOf('artistId');
    var indexAlbum = data.feed.track.indexOf('albumId');
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
    var albums = data.album;
    var album;
    var artist;
    var albumArtists = [];
    var albumList = [];
    var lookup = {};
    var i;
    var indexArt = data.feed.album.indexOf('art');
    var indexArtist = data.feed.album.indexOf('artistId');
    var indexVarious = data.feed.album.indexOf('various');
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
    var artists = data.artist;
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


  function inQueue(trackId) {
    var i;
    for (i = 0; i < queue.length; i++) {
      if (trackId === queue[i].id) {
        return true;
      }
    }
    return false;
  }

  function queueLength() {
    return queue.length;
  }

  function artist(id) {
    var i;
    var item = info.artist[id];
    var obj;
    if (item) {
      obj = {};
      for (i = 0; i < feedData.artist.length; i++) {
        obj[feedData.artist[i]] = item[i];
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
      for (i = 0; i < feedData.album.length; i++) {
        obj[feedData.album[i]] = item[i];
      }
      // helpers
      obj.getTracks = function() {
        return info.albumTracks[this.id] || [];
      };
      obj.getArtistName = function() {
        if (this.various) {
          return 'Various artists';
        } else {
          if (this.artistId === null){
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
      for (i = 0; i < feedData.track.length; i++) {
        obj[feedData.track[i]] = item[i];
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


  function process(data) {
    feedData = data.feed;
    processArtistData(data);
    processAlbumData(data);
    processTrackData(data);
  }

  function setQueue(data){
    queue = data;
  }

  function configGet(key) {
    return config[key];
  }

  function configSet(key, value) {
    config[key] = value;
  }

  return {
    process: process,
    alphaBit: alphaBit,
    alphasArtist: alphasArtist,
    alphasAlbum: alphasAlbum,

    setQueue: setQueue,
    inQueue: inQueue,
    queueLength: queueLength,

    configGet: configGet,
    configSet: configSet,

    trackList: trackList,
    artistList: artistList,
    albumList: albumList,

    album: album,
    artist: artist,
    track: track

  };

});
