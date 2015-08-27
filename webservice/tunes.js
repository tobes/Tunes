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
var queueItems = {};
var currentPaused;
var currentItem;
var currentTimeOffset;
var currentStreamId;


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


function playingChange(current) {
  var item = current.item;
  $('#currentArtist').html(item.artist);
  $('#currentTrack').html(item.track);
  $('#currentCover').attr('src', 'covers/' + item.art + '.png');
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


function processQueue(data) {
  log('Queue', data.data);
  var queue = JSON.parse(data.data);
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
      $item = $(build.buildQueueItem(item));
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
  info.queue = queue;
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
  currentStreamId = data.data;
  log('StreamId', currentStreamId);
}


function processCurrent(data) {
  log('Current', data.data);
  var current = JSON.parse(data.data);
  currentItem = current;
  currentTimeOffset = new Date();
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
}

function playingTick(){
  if (currentItem === undefined){
    return;
  }

  if (currentPaused === true){
    return;
  }
  var progress;
  var current = currentItem;
  var offset = (new Date() - currentTimeOffset) / 1000;
  var position = current.position + offset;
  $('#currentPosition').html(formatTime(position));
  $('#currentDuration').html(formatTime(current.duration));
  if (current.duration) {
    progress = position * 100 / current.duration;
  } else {
    progress = 0;
  }
  $('#currentProgress').val(progress);

}

function log(type, msg){
  var $p = $('p');
  $p.text(type);// + ': ' + msg);
  $('#console').prepend($p);
}


function stream() {
  var evtSource = new EventSource("/stream");
  // stream number
  evtSource.addEventListener('stream_id', processStreamId, false);
  // queue
  evtSource.addEventListener('queue', processQueue, false);
  // current
  evtSource.addEventListener('current', processCurrent, false);
}





function processData(data){
  info.process(data);
  textsearch.buildIndexes();
  interface.init();
  stream();
  setInterval(playingTick, 200);
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
            typeof value === 'object' && objectList.indexOf( value ) === -1
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
