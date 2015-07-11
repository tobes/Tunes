/*global define */

define(function() {

  var info = {};
  var alphas = [];
  var queue = [];
  var feedData = {};

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
    console.log(albumTracks);
    info.tracks = lookup2;
  }


  function processAlbumData(data) {
    var albums = data.album;
    var album;
    var artist;
    var albumArtists = [];
    var lookup = {};
    var i;
    var indexArt = data.feed.album.indexOf('art');
    var indexArtist = data.feed.album.indexOf('artistId');
    var indexVarious = data.feed.album.indexOf('various');
    for (i = 0; i < albums.length; i++) {
      album = albums[i];
      // fix art
      album[indexArt] = album[indexArt] ? album[0] : 0;
      artist = album[indexArtist];
      if (!album[indexVarious] && albumArtists.indexOf(artist) === -1) {
        albumArtists.push(artist);
      }
      lookup[album[0]] = album;
    }
    info.album = lookup;
    info.albumArtists = albumArtists;
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
        alphas.push(alpha);
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
    }
    return obj;
  }

  function trackList() {
    var list = [];
    for (track in info.tracks) {
      if (tracks.hasOwnProperty(track)) {
        list.push(track[0]);
      }
    }
    return list;
  }

  function artistList() {
    return info.artistList;
  }


  function process(data) {
    feedData = data.feed;
    processArtistData(data);
    processAlbumData(data);
    processTrackData(data);
  }

  return {
    process: process,
    alphaBit: alphaBit,
    alphas: alphas,
    queue: queue,
    inQueue: inQueue,

    trackList: trackList,
    artistList: artistList,

    album: album,
    artist: artist,
    track: track

  };

});
