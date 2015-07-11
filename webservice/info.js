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
      if (!album[indexVarious] && albumArtists.indexOf(artist) === -1){
        albumArtists.push(artist);
      }
      lookup[album.shift()] = album;
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
      lookup[artist[0]] = artist[1];
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

  function album(item, field){
    var index = feedData.album.indexOf(field);
    if (index === -1){
      return;
    }
    return item[index -1];
  }


  function track(item, field){
    var index = feedData.track.indexOf(field);
    if (index === -1){
      return;
    }
    return item[index -1];
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
    album: album,
    track: track,
    info: info
  };

});
