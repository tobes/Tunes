/*global define */

define(['jquery', 'info', 'search'], function($, info, search) {

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildSearch() {
    var out = [];
    out.push('<form id="search-form">');
    out.push('<h1>Search</h1>');
    out.push('<p>');
    out.push('<input id="search-text" type="text">');
    out.push('<ul><li><a>Go</a></li></ul>');
    out.push('</p>');
    out.push('</form>');
    return out.join('');
  }

  function buildAdmin() {
    var out = [];
    out.push('<form id="admin-form">');
    out.push('<h1>Admin password</h1>');
    out.push('<p>');
    out.push('<input id="password" type="password">');
    out.push('<ul><li><a>Go</a></li></ul>');
    out.push('</p>');
    out.push('</form>');
    return out.join('');
  }

  function buildLogin() {
    var out = [];
    out.push('<form id="login-form">');
    out.push('<h1>Log in</h1>');
    out.push('<p>');
    out.push('<input id="username" type="text">');
    out.push('<ul><li><a>Go</a></li></ul>');
    out.push('</p>');
    out.push('</form>');
    return out.join('');
  }


  function highlight(info, text) {
    info = escapeHtml(info || '');
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

  function processSearchTerms(text) {
    text = text.toLowerCase();
    text = text.replace(/[^a-z0-9 ]/g, '');
    var i;
    var newText = '';
    var chr;
    for (i = 0; i < text.length; i++) {
      chr = text.charAt(i);
      if (chr === ' ') {
        newText += ' ';
      } else {
        newText += '(' + chr + '|[^\x00-\x7F]+)';
      }
    }
    text = newText.split(/\s+/);
    return text;
  }

  function truncate(arg, n) {
    arg = arg || '';
    var isTooLong = arg.length > n,
      s_ = isTooLong ? arg.substr(0, n - 1) : arg;
    s_ = isTooLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
    return isTooLong ? s_ + '&hellip;' : s_;
  }

  function formatDuration(s) {
    var seconds = s % 60 << 0;
    var minutes = (s / 60) % 60 << 0;
    var hours = (s / 60 / 60) << 0;

    var parts = hours ? [hours, minutes, seconds] : [minutes, seconds];
    var out = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      if (parts[i] < 10 && i !== 0) {
        out.push('0' + parts[i]);
      } else {
        out.push(parts[i]);
      }
    }
    return out.join(':');
    return formatted;
  }

  function resultItem(item, text) {
    var out = [];
    out.push('<div data-result="" class="clearfix">');

    // out.push('<div class="result-img">');
    out.push('<img class="result-img" src="' + item.thumb + '">');
    // out.push('</div>');

    out.push('<div class="track-title">');
    out.push(search.svg(item.type));
   // out.push(' [ ' + item.rank + ' ]');
    out.push(highlight(item.title, text));
    if (item.duration) {
    out.push('<span class="result-duration">');
    out.push('(' + formatDuration(item.duration) + ')');
    out.push('</span>');
    }
    out.push('</div>');
    if (item.artist) {
      out.push('<div class="track-artist">');
      out.push(highlight(item.artist, text));
      out.push('</div>');
    }
    if (item.album) {
      out.push('<div class="track-album">');
      out.push(highlight(item.album, text));
      out.push('</div>');
    }
    if (item.user) {
      out.push('<div class="track-user">');
      out.push(escapeHtml(item.user));
      out.push('</div>');
    }
    out.push('</div>');
    return $(out.join('')).data(item);
  }


  function buildResults(results, text) {
    var i;
    var result;
    var out = [];
    text = processSearchTerms(text);
    out.push('<div class="results">');
    for (i = 0; i < results.length; i++) {
      result = results[i];
      if (result.rank === 0 || i === 100) {
        break;
      }
      out = out.concat(resultItem(result, text));
    }
    return $('<div class="results">').append(out);
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
    for (i = 0; i < styles.length; i++) {
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
    for (i = 0; i < sizes.length; i++) {
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


  function buildQueueItem(item, count) {
    var out = [];
    out.push('<div class="queue-item clearfix">');
    out.push('<img src="' + item.thumb + '">');
    out.push(search.svg(item.type));
    out.push('<div class="queue-content clearfix">');
    out.push('<div class="queue-track">');
    out.push('<span class="queue-place');
    out.push(item.ready ? '' : ' animation-flash');
    out.push('">');
    out.push(count);
    out.push('</span> ');
    out.push(escapeHtml(item.title));
    if (item.artist) {
      out.push('<div class="track-artist">');
      out.push(escapeHtml(item.artist));
      out.push('</div>');
    }
    if (item.album) {
      out.push('<div class="track-album">');
      out.push(escapeHtml(item.album));
      out.push('</div>');
    }
    if (item.user) {
      out.push('<div class="track-user">');
      out.push(escapeHtml(item.user));
      out.push('</div>');
    }
    out.push('</div>');
    out.push('</div>');
    out.push('</div>');
    return $(out.join('')).data(item);
  }

  function buildQueue(queue) {
    var i;
    var item;
    var $item;
    var $queue = $('#queue').empty();
    for (i = 0; i < queue.length; i++) {
      item = queue[i];
      $item = buildQueueItem(item, i + 1);
      $queue.append($item);
    }
    info.setQueue(queue);
  }

  return {
    escapeHtml: escapeHtml,
    formatDuration: formatDuration,
    buildArtistList: buildArtistList,
    buildAlbumList: buildAlbumList,
    buildArtist: buildArtist,
    buildAlbum: buildAlbum,
    buildAlpha: buildAlpha,
    buildSearch: buildSearch,
    buildAdmin: buildAdmin,
    buildLogin: buildLogin,
    buildQueue: buildQueue,
    buildStyles: buildStyles,
    buildResults: buildResults
  };

});
