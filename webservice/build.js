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
      track = info.track(results[i].id);
      out.push('<div data-track="' + track.id + '">');
      out.push('<p>');
      out.push(track.title);
      out.push('</p>');
      out.push('<p><b>');
      out.push(track.getArtist().name);
      out.push('</b></p>');
      out.push('<p>');
      out.push(track.getAlbum().title);
      out.push('</p>');
      out.push('</div>');
    }
    return out.join('');
  }


  function buildArtistList(minTracks) {
    var alpha;
    var alphaLast = '';
    var artist;
    var artistTracks;
    var artistList = info.artistList();
    var $artist = $('#artists');
    var listing;
    var i;
    minTracks = minTracks || 1;
    for (i = 0; i < artistList.length; i++) {
      artist = info.artist(artistList[i]);
    //  console.log(artist);
      // artists with albums only
      if (!artist.hasAlbum()){
        continue;
      }
      artistTracks = artist.getTracks().length;
      // minimum number of tracks
      if (artistTracks < minTracks){
        continue;
      }
      listing = ['<div>'];

      alpha = info.alphaBit(artist.name);
      if (alpha !== alphaLast) {
        listing.push('<a id="artist-alpha-' + alpha + '"></a>');
        alphaLast = alpha;
      }
      listing = listing.concat([
        '<p data-artist="',
        artist.id,
        '" ><b>',
        artist.name,
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
