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
    // trim
    text = text.replace(/^\s+|\s+$/g,'');
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

    out.push('<img class="result-img" src="' + item.thumb + '">');

    out.push('<div class="track-title">');
    out.push(search.svg(item.type));
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
    buildSearch: buildSearch,
    buildAdmin: buildAdmin,
    buildLogin: buildLogin,
    buildQueue: buildQueue,
    buildStyles: buildStyles,
    buildResults: buildResults
  };

});
