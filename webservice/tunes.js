/*global $, document, window*/

var TICK_INTERVAL = 500;
var ERROR_TIMEOUT = 10000;

var feedLock = false;
var currentTrack;
var isFullscreen = false;
var queueVersion = 0;
var queueItems = {};
var queue = [];
var activePage = 'playing';


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
  if (activePage === 'playing') {
    $('#playing').show();
  }
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
  queue = data.queue;
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
      $indicator.removeClass('animation-flash')
    } else {
      $indicator.addClass('animation-flash')
    }
    $queue.append($item);
  }

  queueVersion = data.version;
}

function processFeed(current) {
  if (!current.item){
    return;
  }
  playingUpdate(current);
  if (current.item.id !== currentTrack) {
    playingChange(current);
  }
  if (queueVersion !== current.queue) {

    $.getJSON('queue.json', processQueue);
  }
  feedLock = false;
}

function resize() {
    var height = $(window).height() - $('#header').height();
    $('#container').height(height - 5);
};

window.onresize = resize;

function tick() {
  if (feedLock) {
    return;
  }
  feedLock = true;
  $.ajax({
    url:'feed.json',
    success: processFeed,
    error: errorFeed
  });
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

var menuDivs = ['playing', 'queue', 'artists', 'tracks'];

function showPage(page) {
  var i;
  for (i = 0; i < menuDivs.length; i++) {
    if (page !== menuDivs[i]) {
      $('#' + menuDivs[i]).hide();
    }
  }
  $('#' + page).show();
  if (page) {
    activePage = page;
  }
}

function menuClick(e) {
  var page = $(e.target).data('page');
  if (page) {
    showPage(page);
  }
  var cmd = $(e.target).data('cmd');
  if (cmd) {
    console.log(cmd);
    $.getJSON('cmd/' + cmd);
  };
  // hide menu
  $('#menu').hide();
  showPage(activePage);
}

var info = {};

function buildArtistList(data) {
  var artists = data.artists;
  artists = artists.concat(artists);
  artists = artists.concat(artists);
  artists = artists.concat(artists);
  var artist;
  var lookup = {};
  var $artist = $('#artists');
  var i;
  for (i = 0; i < artists.length; i++) {
    artist = artists[i];
    lookup[artist[0]] = artist[1];
    $artist.append('<div><p data-artist="' + artist[0] + '" ><b>' + artist[1] + '</b></p></div>');
  }
  info.artist = lookup;
  $('[data-artist]').click(artistInfo);
  $.getJSON('album.json', buildALbumList);
}


function tracklistArtist(artist){
var tracks = info.artistTracks[artist]
var i;
var out = [];
for(i=0;i<tracks.length;i++){
  out.push('<p>' + info.tracks[tracks[i]][1] + '</p>')
}
return out.join('');
}
function artistInfo(event) {
  var $element = $(this);
  if ($element.next().length) {
    $element.next().remove();
    return;
  }
  var artist = $element.data('artist');
  $('div.track-list').remove();
  $(this).after('<div class="track-list">' + tracklistArtist(artist) + '</div>');
}

function buildALbumList(data) {
  var albums = data.album;
  var album;
  var lookup = {};
  var i;
  for (i = 0; i < albums.length; i++) {
    album = albums[i];
    lookup[album[0]] = album[1];
  }
  info.album = lookup;
  $.getJSON('track.json', buildTrackList);
}

function buildTrackList(data) {
  var track;
  var tracks = data.tracks
  var i;
  var lookup = {};
  var lookup2 = {};
  for (i = 0; i < tracks.length; i++) {
    track = tracks[i];
    if (lookup[track[2]] === undefined) {
      lookup[track[2]] = [];
    }
    lookup[track[2]].push(track[0]);
    lookup2[track[0]] = track;
  }
  info.artistTracks = lookup;
  info.tracks = lookup2;
  buildArtistList();
}

$(function() {
  $('#header-title h1').click(toggleFullscreen);
  $('#menu-button').click(toggleMenu);
  $('#menu li button').click(menuClick);
  //  setInterval(tick, TICK_INTERVAL);
  resize();
});
