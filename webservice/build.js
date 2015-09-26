/*global define */

define(['jquery', 'info'], function($, info) {

  function buildSearch() {
    var out = [];
    out.push('<h1>Search</h1>');
    out.push('<form id="search-form">');
    out.push('<p>');
    out.push('<input id="search-text" type="text">');
    out.push('</p>');
    out.push('</form>');
    return out.join('');
  }

  function buildAdmin() {
    var out = [];
    out.push('<h1>Admin password</h1>');
    out.push('<form id="admin-form">');
    out.push('<p>');
    out.push('<input id="password" type="text">');
    out.push('</p>');
    out.push('</form>');
    return out.join('');
  }


  function highlight(info, text){
    var i;
    var regex;
    function style(match) {
      return '<i>' + match + '</i>';
    }
    for (i = 0; i < text.length; i++) {
      regex = new RegExp(text[i], 'gi');
      info = info.replace(regex, style);
    }
    return info;
  }

  function processSearchTerms(text){
    text = text.toLowerCase();
    text = text.replace(/[^a-z0-9 ]/g, '');
    var i;
    var newText = '';
    var chr;
    for (i = 0; i < text.length; i++) {
      chr = text.charAt(i);
      if (chr === ' '){
        newText += ' ';
      } else {
        newText += '(' + chr + '|[^\x00-\x7F]+)';
      }
    }
    text = newText.split(' ');
    return text;
  }

  function resultLocal(result, text){
    var out = [];
    var track = info.track(result.id);
    out.push('<div data-track="' + track.id + '">');
    out.push('<img src="/covers/' + track.getAlbum().art + 'T.png">');
    out.push('<div class="track-title">');
    out.push(highlight(track.title, text));
   // out.push(' [' + result.rank + ']');
    out.push('</div>');
    out.push('<div class="track-artist">');
    out.push(highlight(track.getArtist().name, text));
    out.push('</div>');
    out.push('<div class="track-album">');
    out.push(highlight(track.getAlbum().title, text));
    out.push('</div>');
    out.push('</div>');
    return out;
  }

  function resultYoutube(result, text){
    var out = [];
    out.push('<div data-youtube="' + result.id + '" class="clearfix">');
    out.push('<img src="' + result.thumb + '">');
    out.push('<div class="track-title">');
    out.push('<span class="yt">YouTube</span> ');
    out.push(highlight(result.title, text));
    out.push(' (' + result.duration + ')');
   // out.push(' [' + result.rank + ']');
    out.push('</div>');
    out.push('<div class="track-artist">');
    out.push(highlight(result.description, text));
    out.push('</div>');
   // out.push('<div class="track-album">');
   // out.push(highlight(track.getAlbum().title, text));
   // out.push('</div>');
    out.push('</div>');
    return out;
  }


  function buildResults(results, text) {
    results.sort(function(a, b) {
      return a.rank < b.rank;
    });
    var i;
    var result;
    var out = [];
    text = processSearchTerms(text);
    out.push('<div class="results">');
    for (i = 0; i < results.length; i++) {
      // limit results //FIXME
      if (i > 100) {
        break;
      }
      result = results[i];
      switch (result.type){
        case 'local':
          out = out.concat(resultLocal(result, text));
          break;
        case 'youtube':
          out = out.concat(resultYoutube(result, text));
          break;
      }
    }
    out.push('</div>');
    return out.join('');
  }

  function artistTrackSort(a, b) {
    a = info.track(a);
    b = info.track(b);
    var aa = a.getAlbum();
    var ab = b.getAlbum();
    // various
    if (aa.various !== ab.various) {
      return (aa.various > ab.various ? 1 : -1);
    }
    // album title
    if (aa.title !== ab.title) {
      return (aa.title > ab.title ? 1 : -1);
    }
    if (aa.various) { // various?
      // title
      return (a.title > b.title ? 1 : -1);
    }
    // trackNo
    return (a.trackno > b.trackno ? 1 : -1);
  }

  function buildArtist(artistId) {
    var artist = info.artist(artistId);
    var out = [];
    var i;
    out.push('<h1>');
    out.push(artist.name);
    out.push('</h1>');
    var track;
    var album;
    var lastAlbumId;
    var tracks = artist.getTracks();
    tracks.sort(artistTrackSort);

    for (i = 0; i < tracks.length; i++) {
      track = info.track(tracks[i]);
      if (track.albumId !== lastAlbumId) {
        if (lastAlbumId !== undefined) {
          out.push('</div>');
        }
        lastAlbumId = track.albumId;
        album = track.getAlbum();
        out.push('<a href="#album-' + album.id + '">');
        out.push('<div class="artist-album">');
        out.push('<div class="clearfix album-head" data-album="' + album.id + '">');
        out.push('<img src="/covers/' + album.art + 'T.png">');
        out.push(album.title);
        out.push('</div>');
        out.push('</a>');
      }
      out.push('<div data-track="' + track.id + '">');
      if (!album.various) {
        out.push(track.trackno + '. ');
      }
      out.push(track.title);
      out.push('</div>');
    }
    if (lastAlbumId !== undefined) {
      out.push('</div>');
    }
    return (out.join(''));
  }


  function albumTrackSort(a, b) {
    a = info.track(a);
    b = info.track(b);
    return (a.trackno > b.trackno ? 1 : -1);
  }


  function buildAlbum(id) {
    var album = info.album(id);
    var out = [];
    var i;
    var track;
    var tracks = album.getTracks();
    tracks.sort(albumTrackSort);
    out.push('<div class="album clearfix">');
    out.push('<img data-album="' + album.id + '" src="/covers/' + album.art + '.png">');

    out.push('<div class="album-title">');
    out.push(album.title);
    out.push('</div>');
    out.push('<a href="#artist-' + album.artistId + '">');
    out.push('<div class="album-artist">');
    out.push(album.getArtistName());
    out.push('</div>');
    out.push('</a>');
    out.push('</div>');

    out.push('<div class="album-tracks">');
    for (i = 0; i < tracks.length; i++) {
      track = info.track(tracks[i]);
      out.push('<div data-track="' + track.id + '">');
      out.push('<div class="track-no">');
      out.push(track.trackno);
      out.push('</div>');
      out.push('<div class="track-title">');
      out.push(track.title);
      out.push('</div>');
      if (album.various) {
        out.push('<div class="track-artist">');
        out.push(track.getArtistName());
        out.push('</div>');
      }
      out.push('</div>');
    }
    out.push('</div>');
    return (out.join(''));
  }

  function buildAlbumList() {
    var alpha;
    var alphaLast = '';
    var album;
    var albums = info.albumList();
    var $album = $('#album');
    var listing = [];
    var i;

    for (i = 0; i < albums.length; i++) {
      album = info.album(albums[i]);

      alpha = info.alphaBit(album.title);
      if (alpha !== alphaLast) {
        listing.push('<a class="anchor" id="album-' + alpha + '">&nbsp;</a>');
        alphaLast = alpha;
      }

      listing = listing.concat([
        '<a href="#album-',
        album.id,
        '" >',
        album.title,
        '<span>',
        album.getArtistName(),
        '</span>',
        '</a>'
      ]);
    }
    $album.append(listing.join(''));
  }


  function buildArtistList(minTracks) {
    var alpha;
    var alphaLast = '';
    var artist;
    var artistTracks;
    var artistList = info.artistList();
    var $artist = $('#artist');
    var listing = [];
    var i;
    minTracks = minTracks || 1;

    for (i = 0; i < artistList.length; i++) {
      artist = info.artist(artistList[i]);
      // artists with albums only
      if (!artist.hasAlbum()) {
        continue;
      }
      artistTracks = artist.getTracks().length;
      // minimum number of tracks
      if (artistTracks < minTracks) {
        continue;
      }

      alpha = info.alphaBit(artist.name);
      if (alpha !== alphaLast) {
        listing.push('<a class="anchor" id="artist-' + alpha + '">&nbsp;</a>');
        alphaLast = alpha;
      }

      listing = listing.concat([
        '<a href="#artist-',
        artist.id,
        '" >',
        artist.name,
        '<span>',
        artistTracks,
        '</span></a>'
      ]);
    }
    $artist.append(listing.join(''));
  }

  function buildStyles() {
    var styles = [
      ['purple', 'Purple'],
      ['purple-inverse', 'Purple Inverse'],
      ['night', 'Night'],
      ['red', 'Red'],
      ['green', 'Green']
    ];

    var sizes = [
      ['size-small', 'Small'],
      ['size-medium', 'Medium'],
      ['size-large', 'Large'],
      ['size-xlarge', 'Huge']
    ];
    var i;
    var out = [];
    out.push('<div class="listing break-header">Theme</div>');
    out.push('<ul class="menu clearfix">');
    for (i =0; i < styles.length; i++){
      out = out.concat(
        [
        '<li class="style-menu ',
        styles[i][0],
        '"><a data-style="',
        styles[i][0],
        '">',
        styles[i][1],
        '</a></li>'
        ]
      );
    }
    out.push('</ul>');
    out.push('<div class="listing break-header">Size</div>');
    out.push('<ul class="menu">');
    for (i =0; i < sizes.length; i++){
      out = out.concat(
        [
        '<li class="size-menu ',
        sizes[i][0],
        '"><a data-size="',
        sizes[i][0],
        '">',
        sizes[i][1],
        '</a></li>'
        ]
      );
    }
    out.push('</ul>');
    $('#styles').append(out.join(''));
  }



  function buildAlpha(type) {
    var alphas;
    if (type === 'album') {
      alphas = info.alphasAlbum;
    } else {
      alphas = info.alphasArtist;
    }
    var i;
    var out = [];
    out.push('<ul class="button-small">');
    for (i = 0; i < alphas.length; i++) {
      out.push('<li><a href="#' + type + '-' + alphas[i] + '">' + alphas[i] + '</a></li>');
    }
    return out.join('');
  }


  function buildQueueItemLocal(item, count) {
    return [
      '<div class="queue-item clearfix" data-track="',
      item.id,
      '">',
      '<img src="/covers/',
      item.art,
      'T.png">',
      '<div class="queue-content clearfix">',
      '<div class="queue-track">',
      '<span class="queue-place',
      item.ready ? '' : ' animation-flash',
      '">',
      count,
      '</span> ',
      item.track,
      '</div>',
      '<div><b class="queue-artist">',
      item.artist,
      '</b></div>',
      '<div>',
      item.album,
      '</div>',
      '</div>',
      '</div>',
    ].join('');
  }


  function buildQueueItemYoutube(item, count) {
    return [
      '<div class="queue-item clearfix" data-track="',
      item.id,
      '">',
      '<img src="',
      item.thumb,
      '">',
      '<div class="queue-content clearfix">',
      '<div class="queue-track">',
      '<span class="queue-place',
      item.ready ? '' : ' animation-flash',
      '">',
      count,
      '</span> ',
      '<span class="yt">YouTube</span> ',
      item.title,
      '</div>',
      '</div>',
      '</div>',
    ].join('');
  }


  function buildQueueItem(item, count) {
    switch (item.type){
      case 'jukebox':
        return buildQueueItemLocal(item, count);
      case 'youtube':
        return buildQueueItemYoutube(item, count);
    }
  }


  return {
    buildArtistList: buildArtistList,
    buildAlbumList: buildAlbumList,
    buildArtist: buildArtist,
    buildAlbum: buildAlbum,
    buildAlpha: buildAlpha,
    buildSearch: buildSearch,
    buildAdmin: buildAdmin,
    buildQueueItem: buildQueueItem,
    buildStyles: buildStyles,
    buildResults: buildResults
  };

});
