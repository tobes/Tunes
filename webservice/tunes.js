/*global requirejs, EventSource */

requirejs.config({
  paths: {
    jquery: 'jquery',
    scapi: 'https://connect.soundcloud.com/sdk/sdk-3.0.0',
    gapi: 'https://apis.google.com/js/client.js?onload=googleApiClientReady'
  },
  shim: {
    scapi: {
      exports: 'SC'
    },
    gapi: {
      exports: 'gapi'
    }
  }
});

requirejs(['jquery', 'build', 'info', 'interface'],
  function($, build, info, interface) {

    var TICK_INTERVAL = 250;
    var ERROR_TIMEOUT = 10000;

    var evtSource;
    var currentTrack;
    var currentPaused;
    var currentItem;
    var currentTimeOffset;
    var initalized = false;


    function formatTime(time) {
      time = Math.ceil(time);
      if (time < 0) {
        time = 0;
      }
      var seconds = time % 60;
      time = (time - seconds) / 60;
      if (seconds < 10) {
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
      if (item.type === 'jukebox') {
        $('#currentCover').attr('src', 'covers/' + item.art + '.png');
        $('#currentArtist').html(item.artist);
        $('#currentTrack').html(item.track);

      } else {
        $('#currentCover').attr('src', item.art);
        $('#currentArtist').html(item.title);
        $('#currentTrack').html('<span class="' + item.type + '">' + item.type_desc + '</span>');
      }
      currentTrack = item.id;
      $('#playing').data('track', currentTrack);
    }


    function playingUpdate(current) {
      var progress;
      $('#currentPosition').html(formatTime(current.position));
      $('#currentRemaining').html(formatTime(current.duration));
      if (current.duration) {
        progress = current.position * 100 / current.duration;
      } else {
        progress = 0;
      }
      $('#currentProgress').val(progress);
    }


    function processQueue(data) {
      var queue = JSON.parse(data.data);
      var i;
      var item;
      var $item;
      var $queue = $('#queue').empty();
      for (i = 0; i < queue.length; i++) {
        item = queue[i];
        $item = build.buildQueueItem(item, i + 1);
        $queue.append($.parseHTML($item));
      }
      info.setQueue(queue);
    }


    function pausedChange(paused) {
      var $button = $('#play-pause');
      if (paused) {
        $button.data('cmd', 'play');
        $button.text('Play');
      } else {
        $button.data('cmd', 'pause');
        $button.text('Pause');
      }

    }


    function processStreamId(data) {
      $('html').data('stream_id', data.data);
    }


    function processCurrent(data) {
      var current = JSON.parse(data.data);
      currentItem = current;
      currentTimeOffset = new Date();
      if (current) {
        currentPaused = current.paused;
        pausedChange(current.paused);
        if (current.item) {
          playingUpdate(current);
          if (current.item.id !== currentTrack) {
            playingChange(current);
          }
        }
      }
    }

    function playingTick() {
      switch (evtSource.readyState) {
        case 0:
          $('#menu-toggle').addClass('animation-flash');
          break;
        case 1:
          $('#menu-toggle').removeClass('animation-flash');
          break;
        case 2:
          $('#menu-toggle').addClass('animation-flash');
          // firefox on android would not reopen closed connections
          stream();
          break;
      }
      if (currentItem === undefined) {
        return;
      }

      if (currentPaused === true) {
        return;
      }
      var progress;
      var current = currentItem;
      var offset = (new Date() - currentTimeOffset) / 1000;
      var position = current.position + offset;
      if ($('#playing').is(":visible")) {
        $('#currentPosition').html(formatTime(position));
        $('#currentRemaining').html(formatTime(Math.floor(current.duration) - position));
        if (current.duration) {
          progress = position * 100 / current.duration;
        } else {
          progress = 0;
        }
        if ($('#currentProgressDiv').hasClass('progressRemaining')) {
          progress = 100 - progress;
        }
        $('#currentProgress').val(progress);
      }
    }

    function processMessage(data) {
      data = JSON.parse(data.data);
      interface.message(data.text);
    }

    function processConfig(data) {
      data = JSON.parse(data.data);
      info.configSet(data.key, data.value);
    }

    function processInit() {
      if (!initalized) {
        initalized = true;
        interface.init();
        interface.message('All systems are go...');
      }
    }

    function stream() {
      evtSource = new EventSource("/stream");
      // stream number
      evtSource.addEventListener('stream_id', processStreamId, false);
      // queue
      evtSource.addEventListener('queue', processQueue, false);
      // current
      evtSource.addEventListener('current', processCurrent, false);
      // messages
      evtSource.addEventListener('message', processMessage, false);
      // config
      evtSource.addEventListener('config', processConfig, false);
      // init
      evtSource.addEventListener('init', processInit, false);
    }



    $(function() {
      stream();
      setInterval(playingTick, 200);
    });


    function roughSizeOfObject(object) {

      var objectList = [];
      var stack = [object];
      var bytes = 0;

      while (stack.length) {
        var value = stack.pop();

        if (typeof value === 'boolean') {
          bytes += 4;
        } else if (typeof value === 'string') {
          bytes += value.length * 2;
        } else if (typeof value === 'number') {
          bytes += 8;
        } else if (
          typeof value === 'object' && objectList.indexOf(value) === -1
        ) {
          objectList.push(value);

          for (var i in value) {
            stack.push(value[i]);
          }
        }
      }
      return bytes;
    }

  });
