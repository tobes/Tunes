/*global define, document, window, location */


define(['jquery', 'build', 'info', 'index', 'youtube'],
  function($, build, info, textsearch, youtube) {

    var MESSAGE_DISPLAY_TIME = 3000;

    var isFullscreen = false;
    var isAdmin = true;
    var scrolls = {};
    var lastHash;
    var progress = 0;
    var styleSize = 'medium';
    var styleTheme = 'night';
    var lastSearch = '';

    var activePage;
    var menuDivs = [
      'info',
      'artist',
      'album',
      'hash',
      'styles',
    ];

    // ['play', 'pause', 'skip', 'vol:up', 'vol:down', 'add', 'delete', 'album'];

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

    function setStyle() {
      var $element = $(this);
      styleTheme = $element.data('style') || styleTheme;
      styleSize = $element.data('size') || styleSize;
      $('html').removeClass().addClass(styleTheme + ' ' + styleSize);
     // window.history.back();
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
        var streamId = $('html').data('stream_id');
        $.getJSON('cmd/' + cmd, {streamId: streamId});
      }
      // hide any auto-hiding elements (button container)
     // if ($element.data('noclose') !== true){
        //$('div[data-auto=delete]').remove();
     // }
      showPage(activePage);
    }

    function progressClick(){
      progress++;
      if (progress > 2){
        progress = 0;
      }
      progressSet();
    }


    function progressSet(){
      var $div = $('#currentProgressDiv');
      $div.removeClass('progressPosition');
      $div.removeClass('progressRemaining');

      switch (progress){
        case 0:
          $div.addClass('progressPosition');
          break;
        case 1:
          $div.addClass('progressRemaining');
          break;
      }
    }

    function artistScroll(name) {
      // setTimeout to ensure the element is displayed
      // before scrolling
      setTimeout(function (){
        var node = document.getElementById(name);
        node.scrollIntoView();
      }, 1);
    }

    function scrollToView(element) {
      var offset = element.offset().top;
      var height = element.innerHeight();
      var offset_end = offset + height;

      var visible_area_start = window.scrollY;
      var visible_area_end = visible_area_start + window.innerHeight;

      if (offset_end > visible_area_end) {
        window.scrollTo(
          window.scrollX,
          offset_end - window.innerHeight
        );
      }
    }

    function scrollTop(pos) {
      window.scrollTo(window.scrollX, pos);
    }

    function escapeHtml(unsafe) {
      return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
    }


    function makeMenuLink(link, title){
      return '<li><a href="' + link + '">' + escapeHtml(title) + '</a></li>';
    }

    function cmdValid(cmd){
      cmd = cmd.split('-')[0];
      return (isAdmin || cmd === 'add');
    }

    function makeMenuCmd(cmd, title, noClose){
      if (!cmdValid(cmd)){
        return '';
      }
      return '<li><a data-cmd="' + cmd + '"' + (noClose ? ' data-noclose="true"' : '') + '>' + escapeHtml(title) + '</a></li>';
    }

    function closeOpenInfo($element){
      // close if showing
      if ($element.find('div.track-cmd').length) {
        $element.find('div.track-cmd').remove();
        return true;
      }
      // remove any open controls
      $('div.track-cmd').remove();
      return false;
    }

    function currentInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this).parent();

      if (closeOpenInfo($element)){
        return;
      }

      var track = $element.data('track');
     // if (track) {
        track = info.track(track);
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        if (track){
          out.push(makeMenuLink('#artist-' + track.getArtist().id, 'Artist'));
          out.push(makeMenuLink('#album-' + track.getAlbum().id, 'Album'));
        }
        out.push(makeMenuCmd('play', 'Play'));
        out.push(makeMenuCmd('pause', 'Pause'));
        out.push(makeMenuCmd('skip', 'skip'));
        out.push(makeMenuCmd('vol:up', 'Vol +', true));
        out.push(makeMenuCmd('vol:down', 'Vol -', true));
        out.push('</ul>');
        out.push('</div>');
      //}
      $element.append(out.join(''));

      scrollToView($element);
    }

    function albumInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this);
      var album = $element.data('album');
      $element = $element.parent();
      if (closeOpenInfo($element)){
        return;
      }

      if (album) {
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        out.push(makeMenuCmd('album-' + album, 'Play album'));
        out.push('</ul>');
        out.push('</div>');
      }
      $element.append(out.join(''));

      scrollToView($element);
    }

    function queueInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this);

      if (closeOpenInfo($element)){
        return;
      }

      var track = $element.data('track');
      $('div.track-cmd').remove();
      if (track) {
        var track_ = info.track(track);
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        if (track_){
          out.push(makeMenuLink('#artist-' + track_.getArtist().id, 'Artist'));
          out.push(makeMenuLink('#album-' + track_.getAlbum().id, 'Album'));
          out.push(makeMenuCmd('delete-' + track_.id, 'Delete'));
        } else {
          out.push(makeMenuCmd('delete-' + track, 'Delete'));
        }
        out.push('</ul>');
        out.push('</div>');
      }
      $element.append(out.join(''));

      scrollToView($element);
    }

    function youtubeInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this);

      if (closeOpenInfo($element)){
        return;
      }

      var videoId = $element.data('youtube');
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        if (!info.inQueue(videoId)) {
          out.push(makeMenuCmd('add-' + videoId, 'Play'));
        } else {
          out.push('<li><a>This track is in the queue</a></li>');
        }
        out.push('</ul>');
        out.push('</div>');
      $element.append(out.join(''));

      scrollToView($element);
    }


    function trackInfo(event) {
      event.stopPropagation();
      var out = [];
      var i;
      var $element = $(this);

      if (closeOpenInfo($element)){
        return;
      }

      var track = $element.data('track');
      var album = $element.data('album');
      if (track) {
        track = info.track(track);
        out.push('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('<ul>');
        if (!info.inQueue(track.id)) {
          out.push(makeMenuCmd('add-' + track.id, 'Play'));
        } else {
          out.push('<li><a>This track is in the queue</a></li>');
        }
        if ($element.find('.track-artist').length) {
          out.push(makeMenuLink('#artist-' + track.getArtist().id, 'Artist'));
        }
        if ($element.find('.track-album').length) {
          out.push(makeMenuLink('#album-' + track.getAlbum().id, 'Album'));
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

      scrollToView($element);
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
      var height = $(window).height();
      var $toggle = $('#menu-toggle');
      $toggle.show();
      var width = Math.min($('#container').width(), screen.width);
      var toggleWidth = $toggle.outerWidth();
      $toggle.css('left', width - toggleWidth);
    }

    function display(html) {
      $('#hash').empty().append(html);
      showPage('hash');
      //$('#container').scrollTop(0);
      scrollTop(0);
    }


    function showArtist(id) {
      if (!isNumeric(id)) {
        showPage('artist');
        if (id) {
          if (/^[A-Z\#]$/.test(id)){
            artistScroll('artist-' + id);
          } else {
            scrollTop(0);
          }
        } else {
          //$('#container').scrollTop(scrolls.artist || 0);
          scrollTop(scrolls.artist || 0);
        }
        return;
      }
      display(build.buildArtist(id));
    }


    function showAlbum(id) {
      if (!isNumeric(id)) {
        showPage('album');
        if (id) {
          if (/^[A-Z\#]$/.test(id)){
            artistScroll('album-' + id);
          } else {
            scrollTop(0);
          }
        } else {
          //$('#container').scrollTop(scrolls.album || 0);
          scrollTop(scrolls.album || 0);
        }
        return;
      }
      display(build.buildAlbum(id));
    }


    function locationHashChanged() {
      var hash = location.hash.split('-');
      if (lastHash === '#artist') {
        scrolls.artist = window.scrollY;
      }
      if (lastHash === '#album') {
        scrolls.album = window.scrollY;
      }
      if (lastHash && lastHash.split('-')[0] === '#results') {
        scrolls.results = window.scrollY
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
        case '#styles':
          showPage('styles');
          break;
        case '#info':
          showPage('info');
          break;
        case '#search':
          display(build.buildSearch());
          $('#search-form').submit(function(event) {
            event.preventDefault();
            var text = $('#search-text').val();
            lastSearch = text;
            location.href = '#results-' + encodeURIComponent(text);
            $(this).find('input').blur();
          });
          $('#search-text').click(function(e){ $(this).focus(); });
            $('#search-text').trigger('click').val(escapeHtml(lastSearch));

          break;
        case '#results':
          var $msg = message('Searching...', true);
          var text = decodeURIComponent(hash[1]);
          youtube.search(text, function(results){
            results = results.concat(textsearch.search(text));
            $msg.remove();
            display(build.buildResults(results, text));
            //$('#container').scrollTop(scrolls.results || 0);
            scrollTop(scrolls.results || 0);
          });
          break;

      }
    }

    function init() {
      $('#hash').on('click', 'div[data-track]', trackInfo);
      $('#hash').on('click', 'div[data-youtube]', youtubeInfo);
      $('#queue').on('click', 'div[data-track]', queueInfo);
      $('#hash').on('click', 'img[data-album]', albumInfo);
      $('#playing').on('click', 'img', currentInfo);
      resize();
      $('#logo').click(toggleFullscreen);
      $('#menu a').click(function (){showPage(activePage);});
      $('#menu-toggle').click(toggleMenu);
      $('#page').on('click', 'a', buttonClick);
      $('#currentProgressDiv').click(progressClick);
      $('#styles').on('click', 'a[data-style]', setStyle);
      $('#styles').on('click', 'a[data-size]', setStyle);

      $('#queue').on('click', 'a[data-cmd]', buttonClick);
   //   $('#playing').on('click', 'a[data-cmd]', buttonClick);
      $('#hash').on('click', 'a[data-cmd]', buttonClick);
      // android browser needs delay to initiate
      setTimeout(progressSet, 1);
      window.onresize = resize;
      window.onhashchange = locationHashChanged;
      build.buildArtistList();
      build.buildAlbumList();
      build.buildStyles();
      locationHashChanged();
    }


    function message(text, keep) {
      var $msg = $('<li>').text(text);
      $('#messages ul').append($msg);
      function destroy(){
        $msg.remove();
      }
      if (!keep) {
        setTimeout(destroy, MESSAGE_DISPLAY_TIME);
      }
      return $msg;
    }

    return {
      message: message,
      init: init
        // showPage: showPage
    };

  });
