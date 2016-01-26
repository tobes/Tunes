/*global define */

define(['info', 'latin'], function(info, latin) {


  var initialized = false;
  var searchIndex = {};
  var searchPartialIndex = {};


  function searchPreprocess(text) {
    text = latin.convert(text);
    text = text.toLowerCase();
    text = text.replace(/[^a-z0-9 ]/g, '');
    return text.replace(/\W+/g, " ").split(' ');
  }


  function buildIndex(track) {
    var data = searchPreprocess(track.getIndex());
    var i;
    for (i = 0; i < data.length; i++) {
      if (typeof(searchIndex[data[i]]) !== 'object') {
        searchIndex[data[i]] = [track.id];
      } else {
        searchIndex[data[i]].push(track.id);
      }
    }
  }


  function addPartialIndex(word) {
    var len = 3;
    var i;
    var j;
    var partial;
    for (i = len; i < word.length; i++) {
      for (j = 0; j <= word.length - len; j++) {
        partial = word.substr(j, i);
        if (typeof(searchPartialIndex[partial]) !== 'object') {
          searchPartialIndex[partial] = [word];
        } else if (searchPartialIndex[partial].indexOf(word) === -1) {
          searchPartialIndex[partial].push(word);
        }
      }
    }
  }


  function buildPartialIndex() {
    var word;
    searchPartialIndex = {};
    for (word in searchIndex) {
      if (searchIndex.hasOwnProperty(word)) {
        addPartialIndex(word);
      }
    }
  }


  function buildIndexes() {
    console.log('building indexes');
    searchIndex = {};
    var i;
    var tracks = info.trackList();
    for (i = 0; i < tracks.length; i++) {
      buildIndex(info.track(tracks[i]));
    }
    buildPartialIndex();
    console.log('built indexes');
    initialized = true;
  }

  function getIndex(results, text, rank) {
    var i;
    var j;
    var index;
    var track;
    var stopWord;
    for (i = 0; i < text.length; i++) {
      stopWord = latin.isStopWord(text[i]);
      index = searchIndex[text[i]];
      if (index) {
        for (j = 0; j < index.length; j++) {
          track = index[j];
          if (!results[track]) {
            results[track] = {
              rank: 0
            };
          }
          if (!stopWord) {
            results[track].rank += rank;
          } else {
            results[track].rank += rank / 10;
          }
        }
      }
    }
  }


  function sortResults(results) {
    var result;
    var track;
    var album;
    var artist;
    var out = [];
    for (result in results) {
      if (results.hasOwnProperty(result)) {
        track = info.track(result);
        album = track.getAlbum();
        artist = track.getArtist();
        out.push({
          type: 'jukebox',
          //type_desc: 'Tunes!',
          id: parseInt(result, 10),
          title: track.title,
          artist: artist.name,
          artistId: artist.id,
          album: album.title,
          albumId: album.id,
          duration: track.duration << 0,
          thumb: '/covers/' + album.art + 'T.png',
        });
      }
    }
    return out;
  }


  function search(text) {
    if (!initialized){
      console.log('Search not ready');
      return [];
    }
    var i;
    var j;
    var words;
    var word;
    var results = {};
    text = searchPreprocess(text);
    getIndex(results, text, 1);
    // partials
    var partials = [];
    for (i = 0; i < text.length; i++) {
      words = searchPartialIndex[text[i]];
      if (words) {
        for (j = 0; j < words.length; j++) {
          word = words[j];
          partials.push(word);
        }
      }
    }
    getIndex(results, partials, 0.5);
    return sortResults(results);
  }

  info.init(buildIndexes);

  return {
    search: search
  };

});
