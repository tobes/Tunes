/*global define */

define(['zepto', 'info'], function($, info) {

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


  function buildControls() {
    var out = [];
    out.push('<ul>');
    out.push('<li><button id="play-pause" data-cmd="play">Play</button></li>');
    out.push('<li><button data-cmd="skip">Skip</button></li>');
    out.push('</ul>');
    out.push('<div class="clearfix"></div>');
    out.push('<ul>');
    out.push('<li><button data-cmd="vol:up">Vol +</button></li>');
    out.push('<li><button data-cmd="vol:down">Vol -</button></li>');
    out.push('</ul>');
    return out.join('');
  }


  function buildResults(results) {
    var i;
    var track;
    var out = [];
    out.push('<div class="results">');
    for (i = 0; i < results.length; i++) {
      // limit results //FIXME
      if (i > 100) {
        break;
      }
      track = info.track(results[i].id);
      out.push('<div data-track="' + track.id + '">');
      out.push('<img src="/covers/' + track.getAlbum().art + '">');
      out.push('<div class="track-title">');
      out.push(track.title);
      out.push('</div>');
      out.push('<div class="track-artist">');
      out.push(track.getArtist().name);
      out.push('</div>');
      out.push('<div class="track-album">');
      out.push(track.getAlbum().title);
      out.push('</div>');
      out.push('</div>');
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
    } else {
      // trackNo
      return (a.trackno > b.trackno ? 1 : -1);
    }
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
        out.push('<img src="/covers/' + album.art + '">');
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
    out.push('<img src="/covers/' + album.art + '">');

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
    buildAlbumList: buildAlbumList,
    buildArtist: buildArtist,
    buildAlbum: buildAlbum,
    buildAlpha: buildAlpha,
    buildControls: buildControls,
    buildSearch: buildSearch,
    buildResults: buildResults
  };

});
