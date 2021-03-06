/*global define, document, window, location, screen, localStorage */



define(['jquery', 'build', 'info', 'search'],
  function($, build, info, search) {

    var MESSAGE_DISPLAY_TIME = 3000;
    var PASSWORD = 'fish';

    var isFullscreen = false;
    var isAdmin = false;
    var scrolls = {};
    var lastHash;
    var progress = 0;
    var styleSize = 'medium';
    var styleTheme = 'night';
    var lastSearch = '';
    var messages = {};

    var activePage;
    var activeTitle;
    var menuDivs = [
      'playing',
      'info',
      'hash',
      'styles',
    ];

    function makeLinks(text){
      return text.replace(/\b(https?:\/\/\S*)(?=\s)/gi, '<a href="$1">$1</a>');
    }

    // ['play', 'pause', 'skip', 'vol:up', 'vol:down', 'add', 'delete', 'album', 'limit:up', 'limit:down'];

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    if (!Array.prototype.pushNotEmpty){
      Array.prototype.pushNotEmpty = function (item){
        if (item){
          this.push(item);
        }
      };
    }

    function showPage(page, title) {
      var i;
      if (page === undefined){
        page = activePage;
        title = activeTitle;
      }
      for (i = 0; i < menuDivs.length; i++) {
        if (page !== menuDivs[i]) {
          $('#' + menuDivs[i]).hide();
        }
      }

      title = title || 'Tunes!';
      $('#title').text(title);

      $('#' + page).show();

      if (page !== 'menu'){
        activePage = page;
        activeTitle = title;
        $('#menu').hide();
      } else {
        $('#menu').show();
      }
    }


    function toggleMenu() {
      var $menu = $('#menu');
      if ($menu.css('display') !== 'none') {
        showPage();
      } else {
        showPage('menu');
      }
    }

    function setStyle() {
      var $element = $(this);
      styleTheme = $element.data('style') || styleTheme;
      styleSize = $element.data('size') || styleSize;
      $('html').removeClass().addClass(styleTheme + ' ' + styleSize);
      if (localStorage){
          localStorage.styleTheme = styleTheme;
          localStorage.styleSize = styleSize;
      }
    }


    function buttonClick() {
      var $element = $(this);
      var page = $element.data('page');
      if (page) {
        showPage(page);
        // hide menu
        $('#menu').hide();
        return;
      }
      var cmd = $element.data('cmd');
      if (cmd) {
        var streamId = $('html').data('stream_id');
        $.getJSON('cmd/' + cmd, {
          streamId: streamId
        });
      }
      showPage();
    }


    function progressSet() {
      var $div = $('#currentProgressDiv');
      $div.removeClass('progressPosition');
      $div.removeClass('progressRemaining');

      switch (progress) {
        case 0:
          $div.addClass('progressPosition');
          break;
        case 1:
          $div.addClass('progressRemaining');
          break;
      }
    }

    function progressClick() {
      progress++;
      if (progress > 2) {
        progress = 0;
      }
      progressSet();
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

    function cmdValid(cmd) {
      cmd = cmd.split('-')[0];
      return (isAdmin || cmd === 'add');
    }

    function makeMenuCmd(cmd, title, noClose) {
      if (!cmdValid(cmd)) {
        return '';
      }
      return '<li><a data-cmd="' + cmd + '"' + (noClose ? ' data-noclose="true"' : '') + '>' + build.escapeHtml(title) + '</a></li>';
    }

    function closeOpenInfo($element) {
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
      var $element = $('#playing');

      if (closeOpenInfo($element)) {
        return;
      }

      var item = $element.data();
      out.push('<div data-auto="delete" class="track-cmd clearfix">');
      out.push('<ul class="clearfix">');
      out.push(makeMenuCmd('play', 'Play'));
      out.push(makeMenuCmd('pause', 'Pause'));
      out.push(makeMenuCmd('skip', 'skip'));
      out.push(makeMenuCmd('vol:up', 'Vol +', true));
      out.push(makeMenuCmd('vol:down', 'Vol -', true));
      out.push(makeMenuCmd('limit:up', 'Limit +', true));
      out.push(makeMenuCmd('limit:down', 'Limit -', true));
      out.push('</ul>');
      if (item.album){
        out.push('<div>');
        out.push('<b>Album:</b> ' + build.escapeHtml(item.album));
        out.push('</div>');
      }
      if (item.trackNo){
        out.push('<div>');
        out.push('<b>Track number:</b> ' + item.trackNo);
        out.push('</div>');
      }
      if (item.description){
        out.push('<div>');
        out.push('<b>Description:</b> ' + makeLinks(build.escapeHtml(item.description)));
        out.push('</div>');
      }
      out.push('</div>');
      $element.append(out.join(''));

      scrollToView($element);
    }

    function albumInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this);
      var album = $element.data('album');
      $element = $element.parent();
      if (closeOpenInfo($element)) {
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
      var item = $element.data();

      if (closeOpenInfo($element)) {
        return;
      }

      $('div.track-cmd').remove();
      if (item) {
        out.pushNotEmpty(makeMenuCmd('delete-' + item.id, 'Delete'));
        out.pushNotEmpty(makeMenuCmd('queue:up-' + item.id, 'Up'));
        out.pushNotEmpty(makeMenuCmd('queue:down-' + item.id, 'Down'));
        out.pushNotEmpty(makeMenuCmd('queue:top-' + item.id, 'Top'));
        out.pushNotEmpty(makeMenuCmd('queue:bottom-' + item.id, 'Bottom'));
        if (out.length){
          out.unshift('<ul class="clearfix">');
          out.push('</ul>');
        }
        if (item.duration){
          out.push('<div>');
          out.push('<b>Duration:</b> ' + build.formatDuration(item.duration));
          out.push('</div>');
        }
        if (item.trackNo){
          out.push('<div>');
          out.push('<b>Track number:</b> ' + item.trackNo);
          out.push('</div>');
        }
        if (item.description){
          out.push('<div>');
          out.push('<b>Description:</b> ' + makeLinks(build.escapeHtml(item.description)));
          out.push('</div>');
        }
      }
      if (out.length){
        out.unshift('<div data-auto="delete" class="track-cmd clearfix">');
        out.push('</div>');
        $element.append(out.join(''));
      }

      scrollToView($element);
    }

    function playButton(id) {
      if (info.queueLength() >= info.configGet('queueLimit')) {
        return '<li><a>The queue is currently full</a></li>';
      }

      if (info.inQueue(id)) {
        return '<li><a>This track is in the queue</a></li>';
      }
      return makeMenuCmd('add-' + id, 'Play');
    }

    function resultInfo(event) {
      event.stopPropagation();
      var out = [];
      var $element = $(this);
      var item = $element.data();

      if (closeOpenInfo($element)) {
        return;
      }

      out.push('<div data-auto="delete" class="track-cmd clearfix">');
      out.push('<ul class="clearfix">');
      out.push(playButton(item.id));
      out.push('</ul>');
      if (item.trackNo){
        out.push('<div>');
        out.push('<b>Track number:</b> ' + item.trackNo);
        out.push('</div>');
      }
      if (item.description){
        out.push('<div>');
        out.push(makeLinks(build.escapeHtml(item.description)));
        out.push('</div>');
      }
      out.push('</div>');
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
      }
      // trackNo
      return (a.trackNo > b.trackNo ? 1 : -1);
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
      var $toggle = $('#menu-toggle');
      $toggle.show();
      var width = Math.min($('#container').offset().left + $('#container').width(), screen.width);
      var toggleWidth = $toggle.outerWidth();
      $toggle.css('left', width - toggleWidth);
    }

    function display(html, title) {
      $('#hash').empty().append(html);
      showPage('hash', title);
      scrollTop(0);
    }

    function message(msg) {
      var text = msg.text;
      var keep = msg.keep || false;
      var name = msg.name;

      if (name && messages[name]){
        messages[name].remove();
      }

      var $msg = $('<li>').text(text);
      $('#messages ul').append($msg);

      function destroy() {
        $msg.remove();
      }

      if (!keep) {
        setTimeout(destroy, MESSAGE_DISPLAY_TIME);
      }

      if (name){
        messages[name] = $msg;
      }

      return $msg;
    }


    function locationHashChanged() {
      var hash = location.hash.split(/-(.+)/);
      if (lastHash === '#artist') {
        scrolls.artist = window.scrollY;
      }
      if (lastHash === '#album') {
        scrolls.album = window.scrollY;
      }
      if (lastHash && lastHash.split('-')[0] === '#results') {
        scrolls.results = window.scrollY;
      }
      lastHash = location.hash;
      switch (hash[0]) {
        case '#styles':
          showPage('styles', 'Styles');
          break;
        case '#playing':
          showPage('playing');
          break;
        case '#info':
          showPage('info', 'Info');
          break;
        case '#admin':
          display(build.buildAdmin(), 'Admin');
          $('#admin-form').submit(function(event) {
            event.preventDefault();
            var pw = $('#password').val();
            isAdmin = (pw === PASSWORD);
            $(this).find('input').blur();
            location.href = '#playing';
            if (isAdmin) {
              message({text: 'Admin enabled'});
            } else {
              message({text: 'Password incorrect'});
            }
          });
          $('#password').click(function() {
            $(this).focus();
          });
          $('#password').trigger('click').val(build.escapeHtml(lastSearch));
          $('#admin-form a').click(function() {
            $('#admin-form').submit();
          });

          break;
        case '#search':
          display(build.buildSearch(), 'Search');
          $('#search-form').submit(function(event) {
            event.preventDefault();
            var text = $('#search-text').val();
            lastSearch = text;
            $(this).find('input').blur();
            $('#search-form').hide();
            location.href = '#results-' + encodeURIComponent(text);
          });
          $('#search-text').click(function() {
            $(this).focus();
          });
          $('#search-text').trigger('click').val(lastSearch);
          $('#search-form a').click(function() {
            $('#search-form').submit();
          });

          break;
        case '#results':
          var $msg = message({text: 'Searching...', keep: true});
          var text = decodeURIComponent(hash[1]);
          search.search(text, function(results) {
            $msg.remove();
            display(build.buildResults(results, text), 'Results');
            scrollTop(scrolls.results || 0);
          });
          break;
      }
    }

    function init() {
      if (localStorage){
          styleTheme = localStorage.styleTheme || styleTheme;
          styleSize = localStorage.styleSize || styleSize;
          setStyle();
      }
      $('#loader').css({display: 'none'});
      $('#page').css({display: 'block'});

      $('#hash').on('click', 'div[data-result]', resultInfo);
      $('#queue').on('click', 'div.queue-item', queueInfo);
      $('#hash').on('click', 'img[data-album]', albumInfo);
      $('#playing').on('click', 'img', currentInfo);
      resize();
      $('#title').click(toggleFullscreen);
      $('#menu-toggle').click(toggleMenu);
      $('#page').on('click', 'a', buttonClick);
      $('#currentProgressDiv').click(progressClick);
      $('#styles').on('click', 'a[data-style]', setStyle);
      $('#styles').on('click', 'a[data-size]', setStyle);

      $('#queue').on('click', 'a[data-cmd]', buttonClick);
      $('#hash').on('click', 'a[data-cmd]', buttonClick);
      // android browser needs delay to initiate
      setTimeout(progressSet, 1);
      window.onresize = resize;
      window.onhashchange = locationHashChanged;
      build.buildStyles();
      locationHashChanged();
    }


    return {
      message: message,
      init: init
    };

  });
