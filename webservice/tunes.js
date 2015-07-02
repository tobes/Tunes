/*global $, document, window*/

var TICK_INTERVAL = 200;

var feedLock = false;
var currentTrack;
var defaultScreenSize;


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
  $('#currentAlbum').html(item.album);
  $('#currentArtist').html(item.artist);
  $('#currentTrack').html(item.track);
  currentTrack = item.id;
  $('#playing').show();
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


function processFeed(data) {
  var current = data.current;
  playingUpdate(current);
  if (current.item.id !== currentTrack) {
    playingChange(current);
  }
  feedLock = false;
}


function tick() {
  if (feedLock) {
    return;
  }
  feedLock = true;
  $.getJSON('feed.json', processFeed);
}


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


function toggleFullscreen() {
  if (!defaultScreenSize) {
    defaultScreenSize = window.innerHeight;
  }
  if (defaultScreenSize < window.innerHeight) {
    // browser is fullscreen
    fullscreenExit();
  } else {
    fullscreenLaunch();
  }
}


$(function() {
  $('h1').click(toggleFullscreen);
  setInterval(tick, TICK_INTERVAL);
});
