/*global define */

define(['zepto', 'info'], function($, info) {

  function buildResults(results) {
    var i;
    var track;
    var out = [];
    for (i = 0; i < results.length; i++) {
      // limit results //FIXME
      if (i > 100){
        break;
      }
      track = info.info.tracks[results[i].id];
      out.push('<div data-track="' + track[0] + '">');
      out.push('<p>');
      out.push(track[1]);
      out.push('</p>');
      out.push('<p><b>');
      out.push(info.info.artist[track[2]]);
      out.push('</b></p>');
      out.push('<p>');
      out.push(info.info.album[track[3]]);
      out.push('</p>');
      out.push('</div>');
    }
    return out.join('');
  }


  function buildArtistList(minTracks) {
    var alpha;
    var alphaLast = '';
    var artistId;
    var artistName;
    var artistTracks;
    var artistList = info.info.artistList;
    var $artist = $('#artists');
    var listing;
    var i;
    minTracks = minTracks || 1;
    for (i = 0; i < artistList.length; i++) {
      artistId = artistList[i];
      // artists with albums only
      if (info.info.albumArtists.indexOf(artistId) === -1){
        continue;
      }
      if (info.info.artistTracks[artistId]) {
        artistTracks = info.info.artistTracks[artistId].length;
      } else {
        artistTracks = 0;
      }
      // minimum number of tracks
      if (artistTracks < minTracks){
        continue;
      }
      listing = ['<div>'];
      artistName = info.info.artist[artistId];

      alpha = info.alphaBit(artistName);
      if (alpha !== alphaLast) {
        listing.push('<a id="artist-alpha-' + alpha + '"></a>');
        alphaLast = alpha;
      }
      listing = listing.concat([
        '<p data-artist="',
        artistId,
        '" ><b>',
        artistName,
        '</b> <span>',
        artistTracks,
        '</span></p></div>'
      ]);
      $artist.append(listing.join(''));
    }
  }


  function buildAlpha() {
    var alphas = info.alphas;
    var i;
    var $alpha = $('#alpha').empty();
    var $list = $('<ul class="button-small">');

    for (i = 0; i < alphas.length; i++) {
      $list.append('<li><button data-alpha="' + alphas[i] + '">' + alphas[i] + '</button></li>');
    }
    $alpha.append($list);
  }



  return {
    buildArtistList: buildArtistList,
    buildAlpha: buildAlpha,
    buildResults: buildResults
  };

});
