/*global define, document, window */


define(['zepto', 'build', 'info', 'index'],
  function($, build, info, textsearch) {
    var isFullscreen = false;

    var activePage;
    var menuDivs = [
      'controls',
      'playing',
      'queue',
      'artists',
      'search',
      'results',
      'hash',
      'alpha'
    ];



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
        $menu.show();
        showPage();
      }
    }


    function search() {
      var text = $('#search-text').val();
      var results = textsearch.search(text); //FIXME
      $('#results').empty().append(build.buildResults(results));
      $('#results').on('click', 'div', trackInfo);
      showPage('results');
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
      var action = $element.data('action');
      if (action) {
        search();
      }
      if ($element.parent().data('auto') === 'delete') {
        $element.parent().remove();
      }
      showPage(activePage);
    }


    function artistScroll(name) {
      showPage('artists');
      var node = document.getElementById(name);
      node.scrollIntoView();
    }




    function trackInfo(event) {
      event.stopPropagation();
      var out;
      var i;
      var $element = $(this);
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
        out = ['<div data-auto="delete" class="track-cmd">'];
        if (!info.inQueue(track)) {
          out.push('<button data-cmd="add-' + track + '">Play</button>');
        } else {
          out.push('<span>cued</span>');
        }
        out.push('</div>');
      }
      if (album) {
        out = ['<div data-auto="delete" class="track-cmd">'];
        var albumTracks = info.album(album).getTracks();
        for (i = 0; i < albumTracks.length; i++) {
          track = info.track(albumTracks[i]);
          out.push('<div data-track="' + track.id + '"><p>' + track.title + '</p></div>');
        }
        out.push('</div>');
      }
      $element.append(out.join(''));

      $element.on('click', 'button', buttonClick);
    }


    function artistTrackSort(a, b) {
      a = info.track(a);
      b = info.track(b);
      var aa = a.getAlbum();
      var ab = b.getAlbum();
      // various
      if (aa.various !== ab.various) {
        return aa.various > ab.various;
      }
      // album title
      if (aa.title !== ab.title) {
        return aa.title > ab.title;
      }
      if (aa.various) { // various?
        // title
        return a.title > b.title;
      } else {
        // trackNo
        return a.trackNo > b.trackNo;
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
            out.push('<img src="/covers/' + album.art + '">');
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
      $('.track-list').on('click', 'div', trackInfo);
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
      var height = $(window).height() - $('#header').height();
      $('#container').height(height - 5);
    }

    function init() {
      resize();
      build.buildArtistList();
      $('#artists').on('click', 'div', artistInfo);
      build.buildAlpha();
      $('#alpha').on('click', 'button', function() {
        artistScroll('artist-alpha-' + $(this).data('alpha'));
      });
      $('#header-title h1').click(toggleFullscreen);
      $('#menu-toggle').click(toggleMenu);
      $('#page').on('click', 'button', buttonClick);
      $('#search form').submit(function(event) {
        event.preventDefault();
        search();
        $(this).find('input').blur();
      });
      window.onresize = resize;
    }


    function showArtist(){
      $('#hash').empty().append(build.buildArtistList());

      $('#hash').on('click', 'div', artistInfo);
    }

    function locationHashChanged() {
      var hash = location.hash.split('~');
      console.log(hash[0]);
      switch (hash[0]){
        case '#artists':
          showArtist()
          break;
      }
    }

    location.hash='#';
  //  window.onhashchange = locationHashChanged;
    return {
      init: init
        // showPage: showPage
    };

  });
