/*global define, document, window, location */


define(['zepto', 'build', 'info', 'index'],
  function($, build, info, textsearch) {
    var isFullscreen = false;
    var scrolls = {};
    var lastHash;

    var activePage;
    var menuDivs = [
      'playing',
      'queue',
      'artist',
      'album',
      'hash',
    ];

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function showPage(page) {
      var i;
      for (i = 0; i < menuDivs.length; i++) {
        if (page !== menuDivs[i]) {
          $('#' + menuDivs[i]).hide();
        }
      }
      $('#' + page).show();
      if (page) {
        $('#menu').hide();
        activePage = page;
      }
    }


    function toggleMenu() {
      var $menu = $('#menu');
      if ($menu.css('display') !== 'none') {
        $menu.hide();
        showPage(activePage);
      } else {
        var hash = location.hash.split('-')[0];
        var $alpha = $('#menu-alpha');
        if (hash === '#artist') {
          $alpha.attr('href', '#alpha-artist');
          $alpha.parent().show();
        } else if (hash === '#album') {
          $alpha.attr('href', '#alpha-album');
          $alpha.parent().show();
        } else {
          $alpha.parent().hide();
        }

        $menu.show();
        showPage();
      }
    }


    function buttonClick() {
      var $element = $(this);
      var page = $element.data('page');
      if (page) {
        // location.hash = '#' + page;
        showPage(page);
        // hide menu
        $('#menu').hide();
        // $('#hash').show();
        return;
      }
      var cmd = $element.data('cmd');
      if (cmd) {
        $.getJSON('cmd/' + cmd);
      }
      if ($element.parent().data('auto') === 'delete') {
        $element.parent().remove();
      }
      showPage(activePage);
    }


    function artistScroll(name) {
      var node = document.getElementById(name);
      node.scrollIntoView();
    }




    function trackInfo(event) {
      event.stopPropagation();
      var out = [];
      var i;
      var $element = $(this);
      console.log($element);
      var track = $element.data('track');
      var album = $element.data('album');
      // close if showing
      if ($element.find('div.track-cmd').length) {
        $element.find('div.track-cmd').remove();
        return;
      }
      // remove any open controls
      $element.parent().find('div.track-cmd').remove();
      if (track) {
        track = info.track(track);
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        if (!info.inQueue(track.id)) {
          out.push('<li><a data-cmd="add-' + track.id + '">Play</a></li>');
        } else {
          out.push('<li><span>cued</span></li>');
        }
        if ($element.find('.track-artist').length) {
          out.push('<li><a href="#artist-' + track.getArtist().id + '">Artist</a></li>');
        }
        if ($element.find('.track-album').length) {
          out.push('<li><a href="#album-' + track.getAlbum().id + '">Album</a></li>');
        }
        out.push('</ul>');
        out.push('</div>');
      }
      if (album) {
        out.push('<div data-auto="delete" class="track-cmd">');
        var albumTracks = info.album(album).getTracks();
        for (i = 0; i < albumTracks.length; i++) {
          track = info.track(albumTracks[i]);
          out.push('<div data-track="' + track.id + '"><p>' + track.title + '</p></div>');
        }
        out.push('</div>');
      }
      $element.append(out.join(''));

      $element.on('click', 'a[data-cmd]', buttonClick);
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
        return (a.trackNo > b.trackNo ? 1 : -1);
      }
    }


    function tracklistArtist(artistId) {
      var album;
      var track;
      var i;
      var lastAlbumId;
      var out = [];
      var tracks = info.artist(artistId).getTracks();

      tracks.sort(artistTrackSort);
      for (i = 0; i < tracks.length; i++) {
        track = info.track(tracks[i]);
        if (track.albumId !== lastAlbumId) {
          lastAlbumId = track.albumId;
          album = track.getAlbum();
          if (!album.various) {
            out.push('<div class="clearfix" data-album="' + album.id + '">');
            out.push('<img src="/covers/' + album.art + '.png">');
            out.push('<p><b>' + album.title + '</p></b>');
            out.push('</div>');
          }
        }
        if (album.various) {
          out.push('<div data-track="' + track.id + '"><p>' + track.title + '</p></div>');
        }
      }
      return out.join('');
    }

    function artistInfo() {
      var $element = $(this).children('p');
      if ($element.next().length) {
        $element.next().remove();
        return;
      }
      var artistId = $element.data('artist');
      $('div.track-list').remove();
      var listing = [];
      listing = listing.concat([
        '<div class="track-list">',
        tracklistArtist(artistId),
        '</div>'
      ]);
      $element.after(listing.join(''));
      $element.parent()[0].scrollIntoView();
    }



    function toggleFullscreen() {
      // fullscreen thanks to http://davidwalsh.name/fullscreen

      function fullscreenLaunch() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      }

      function fullscreenExit() {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
      if (isFullscreen) {
        fullscreenExit();
      } else {
        fullscreenLaunch();
      }
      isFullscreen = !isFullscreen;
    }


    function resize() {
      var height = $(window).height(); - $('#container').height(height);

      var $toggle = $('#menu-toggle');
      $toggle.show();
      var width = Math.min($('#container').width(), screen.width);
      var toggleWidth = $toggle.width();
      $toggle.css('left', width - toggleWidth);
    }

    function display(html) {
      $('#hash').empty().append(html);
      showPage('hash');
      $('#container').scrollTop(0);
    }


    function showArtist(id) {
      if (!isNumeric(id)) {
        showPage('artist');
        if (id) {
          artistScroll('artist-' + id);
        } else {
          $('#container').scrollTop(scrolls.artist || 0);
        }
        return;
      }
      display(build.buildArtist(id));
    }


    function showAlbum(id) {
      if (!isNumeric(id)) {
        showPage('album');
        if (id) {
          artistScroll('album-' + id);
        } else {
          $('#container').scrollTop(scrolls.album || 0);
        }
        return;
      }
      display(build.buildAlbum(id));
    }


    function locationHashChanged() {
      var hash = location.hash.split('-');
      if (lastHash === '#artist') {
        scrolls.artist = $('#container').scrollTop();
      }
      if (lastHash === '#album') {
        scrolls.album = $('#container').scrollTop();
      }
      if (lastHash && lastHash.split('-')[0] === '#results') {
        scrolls.results = $('#container').scrollTop();
      }
      lastHash = location.hash;
      switch (hash[0]) {
        case '#artist':
          showArtist(hash[1]);
          break;
        case '#album':
          showAlbum(hash[1]);
          break;
        case '#alpha':
          display(build.buildAlpha(hash[1]));
          break;
        case '#controls':
          display(build.buildControls());
          break;
        case '#playing':
          showPage('playing');
          break;
        case '#queue':
          showPage('queue');
          break;
        case '#search':
          display(build.buildSearch());
          $('#search-form').submit(function(event) {
            event.preventDefault();
            var text = $('#search-text').val();
            location.href = '#results-' + encodeURIComponent(text);
            $(this).find('input').blur();
          });
          break;

        case '#results':
          var results = textsearch.search(decodeURIComponent(hash[1]));
          display(build.buildResults(results));
          $('#container').scrollTop(scrolls.results || 0);
          break;
      }
    }

    function init() {
      $('#hash').on('click', 'div[data-track]', trackInfo);
      resize();
      //$('h1').click(toggleFullscreen);
      $('#logo').click(toggleMenu);
      $('#menu a').click(function (){$('#menu').hide();showPage(activePage);});
      $('#menu-toggle').click(toggleMenu);
      $('#page').on('click', 'button', buttonClick);
      window.onresize = resize;
      window.onhashchange = locationHashChanged;
      build.buildArtistList();
      build.buildAlbumList();
      locationHashChanged();
    }


    return {
      init: init
        // showPage: showPage
    };

  });
