/*global define */

define(['jquery', 'event', 'qrcode', 'webservice'], function($, event, qrcode, webservice) {

  var parts = {};

  function build(template, location, callback) {
    function insert(data) {
      $(location).html(data);
      if (callback) {
        callback(location);
      }
    }
    $.get('html/' + template + '.html', insert, 'html');
  }

  function template(name) {
    function insert(data) {
      parts[name] = data;
    }
    $.get('html/' + name + '.html', insert, 'html');
  }

  function formatTime(time) {
    time = Math.ceil(time);
    var seconds = time % 60;
    time = (time - seconds) / 60;
    if (seconds < 10){
      seconds = '0' + seconds;
    }
    var mins = time % 60;
    var hours = (time - mins) / 60;
    if (!hours) {
      return mins + ':' + seconds;
    }
  }

  function playingChange(current) {
    var item = current.item;
    $('#currentAlbum').html(item.album);
    $('#currentArtist').html(item.artist);
    $('#currentTrack').html(item.track);
  }

  function playingUpdate(current) {
    var progress;
    $('#currentPosition').html(formatTime(current.position));
    $('#currentDuration').html(formatTime(current.duration));
    if (current.duration){
      progress = current.position * 100/current.duration;
    } else {
      progress = 0;
    }
    $('#currentProgress').val(progress);
  }

  function playlistChange(queue) {
    var i;
    var $list;
    var item;
    var $queue = $('#queueItems').empty();
    for (i = 0; i < queue.length; i++) {
      $list = $(parts.queue_item);
      item = queue[i];
      $list.find('.queue-artist').html(item.artist);
      $list.find('.queue-album').html(item.album);
      $list.find('.queue-track').html(item.track);
      $list.find('.queue-track-no').html(item.trackNo);
      $list.find('.queue-duration').html(item.duration);
      if (!item.ready) {
        $list.addClass('not-ready');
      }
      $queue.append($list);
    }
  }


  function initPlaying() {
    event.add('playingUpdate', playingUpdate);
    event.add('playingChange', playingChange);
  }

  function initQueue() {
    event.add('playlistUpdate', playlistChange);
  }

  function initControls(controls) {
    event.attach(controls);
  }

  function initWebservice() {
    var url = webservice.url();
    if (url) {
      var $qrcode = $('<div>');
      new qrcode($qrcode[0], {
        text: url,
        width: 128,
        height: 128,
        colorDark: '#000',
        colorLight: '#fff',
        correctLevel: qrcode.CorrectLevel.L
      });
      $('#webservice').append($qrcode);
    }
  }

  function init2() {
    build('playing', '#playing', initPlaying);
    build('queue', '#queue', initQueue);
    build('controls', '#controls', initControls);
    initWebservice();
  }

  function init() {
    $('body').append('<div id="tunes">');
    build('base', '#tunes', init2);
    template('queue_item');
  }

  init();

  return {};

});
