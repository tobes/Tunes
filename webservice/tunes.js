/*global $, document, window*/
/*global requirejs */

requirejs.config({
  paths: {
    zepto: 'zepto.min'
  },
  shim: {
    'zepto': {
      exports: '$'
    }
  }
});

requirejs(['zepto', 'index', 'build', 'info', 'interface'],
          function($, textsearch, build, info, interface) {

var TICK_INTERVAL = 250;
var ERROR_TIMEOUT = 10000;

var currentTrack;
var queueVersion = 0;
var queueItems = {};
var currentPaused;

function formatTime(time) {
  time = Math.ceil(time);
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


var queueItemTemplate = [
  '<div class="queue-item">',
  '<div class="queue-place"></div>',
  '<div class="queue-content">',
  '<p class="queue-track"></p>',
  '<p><b class="queue-artist"></b></p>',
  '</div>',
  '</div>',
].join('\n');

function playingChange(current) {
  var item = current.item;
  $('#currentArtist').html(item.artist);
  $('#currentTrack').html(item.track);
  $('#currentCover').attr('src', 'covers/' + item.art);
  currentTrack = item.id;
}


function playingUpdate(current) {
  var progress;
  $('#currentPosition').html(formatTime(current.position));
  $('#currentDuration').html(formatTime(current.duration));
  if (current.duration) {
    progress = current.position * 100 / current.duration;
  } else {
    progress = 0;
  }
  $('#currentProgress').val(progress);
}

function queueItemBuild(item) {
  var $item = $(queueItemTemplate);
  $item.find('.queue-artist').html(item.artist);
  $item.find('.queue-album').html(item.album);
  $item.find('.queue-track').html(item.track);
  return $item;
}


function processQueue(data) {
  var queue = data.queue;
  var i;
  var item;
  var $item;
  var $indicator;
  var items = [];
  var $queue = $('#queue').empty();
  for (i = 0; i < queue.length; i++) {
    item = queue[i];
    $item = queueItems[item.id];
    if ($item === undefined) {
      $item = queueItemBuild(item);
      queueItems[item.id] = $item;
    }
    items.push(item.id);
    $indicator = $item.find('.queue-place');
    $indicator.html(i + 1);
    if (item.ready) {
      $indicator.removeClass('animation-flash');
    } else {
      $indicator.addClass('animation-flash');
    }
    $queue.append($item);
  }
  queueVersion = data.version;
  info.queue = queue;
}


function errorFeed() {
  setTimeout(tick, ERROR_TIMEOUT);
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


function processFeed(feed) {
  var current = feed.current;
  var queue = feed.queue;
  if (current){
  if (current.paused !== currentPaused) {
    pausedChange(current.paused);
    currentPaused = current.paused;
  }
  if (current.item) {
    playingUpdate(current);
    if (current.item.id !== currentTrack) {
      playingChange(current);
    }
  }
  }
  if (queue) {
    processQueue(queue);
  }

  setTimeout(tick, TICK_INTERVAL);
}



function tick() {
  $.ajax({
    url: 'feed.json',
    type: 'POST',
    data: {
      queue: queueVersion
    },
    success: processFeed,
    error: errorFeed
  });
}








function processData(data){
  info.process(data);
  textsearch.buildIndexes();
  interface.init();
  tick();
}


$(function() {
  $.getJSON('data.json', processData);
});


function roughSizeOfObject( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}

});
