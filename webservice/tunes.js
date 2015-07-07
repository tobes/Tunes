/*global $, document, window*/

var TICK_INTERVAL = 1500;
var ERROR_TIMEOUT = 10000;

var feedLock = false;
var currentTrack;
var isFullscreen = false;
var queueVersion = 0;
var queueItems = {};
var queue = [];
var activePage;

var menuDivs = [
  'controls',
  'playing',
  'queue',
  'artists',
  'alpha'
];

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
      $indicator.removeClass('animation-flash');
    } else {
      $indicator.addClass('animation-flash');
    }
    $queue.append($item);
  }

  queueVersion = data.version;
}

function errorFeed() {
  setTimeout(function () {feedLock = false;}, ERROR_TIMEOUT);
}

function processFeed(current) {
  if (current.item) {
    playingUpdate(current);
    if (current.item.id !== currentTrack) {
      playingChange(current);
    }
  }
  if (queueVersion !== current.queue) {
    $.getJSON('queue.json', processQueue);
  }
  feedLock = false;
}


function resize() {
  var height = $(window).height() - $('#header').height();
  $('#container').height(height - 5);
}

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
    $.getJSON('cmd/' + cmd);
  }
  if ($element.parent().data('auto') === 'delete'){
    $element.parent().remove();
  }
  showPage(activePage);
}

var info = {};

function processArtistData(data) {
  var artists = data.artists;
  artists.sort(function(a, b) {
    return a[1].toUpperCase() > b[1].toUpperCase();
  });
  // artists = artists.concat(artists);
  var artist;
  var lookup = {};
  var i;
  var artistList = [];
  for (i = 0; i < artists.length; i++) {
    artist = artists[i];
    lookup[artist[0]] = artist[1];
    artistList.push(artist[0]);
  }
  info.artist = lookup;
  info.artistList = artistList;
  $.getJSON('album.json', processAlbumData);
}

function alphaBit(value) {
  var alpha = value[0].toUpperCase();
  if (alpha < 'A') {
    alpha = '#';
  }
  return alpha;
}


function artistScroll(name){
  showPage('artists');
  var node = document.getElementById(name);
node.scrollIntoView();
}


function buildAlpha(alphas) {
  var i;
  var $alpha = $('#alpha').empty();
  var $list = $('<ul class="button-small">');
  if (alphas[0] === '#'){
    alphas.splice(0, 1);
  }

  for (i=0;i<alphas.length;i++){
    $list.append('<li><button data-alpha="' + alphas[i] + '">' + alphas[i] + '</button></li>');
  }
  $list.on('click', 'button', function (){
    artistScroll('artist-alpha-' + $(this).data('alpha'));
  });
  $alpha.append($list);
}

function buildArtistList() {
  var alpha;
  var alphas = [];
  var alphaLast = '';
  var artistId;
  var artistName;
  var artistTracks;
  var artistList = info.artistList;
  var $artist = $('#artists');
  var listing;
  var i;
  for (i = 0; i < artistList.length; i++) {
    listing = ['<div>'];
    artistId = artistList[i];
    artistName = info.artist[artistId];
    artistTracks = info.artistTracks[artistId].length;

    alpha = alphaBit(artistName);
    if (alpha !== alphaLast) {
      listing.push('<a id="artist-alpha-' + alpha + '"></a>');
      alphaLast = alpha;
      alphas.push(alpha);
    }

    listing = listing.concat([
      '<p data-artist="',
      artistId,
      '" ><b>',
      artistName,
      '</b> <span>',
      artistTracks,
      '</span></p></div>'
    ]);
    $artist.append(listing.join(''));
  }
  buildAlpha(alphas);
  $artist.on('click', 'div', artistInfo);

  showPage();
}

function tracklistArtist(artist) {
  var track;
  var tracks = info.artistTracks[artist];
  var i;
  var out = [];
  for (i = 0; i < tracks.length; i++) {
    track = info.tracks[tracks[i]];
    out.push('<div><p data-track="'+ track[0] + '">' + track[1] + '</p></div>');
  }
  return out.join('');
}


function artistInfo() {
  var $element = $(this).children('p');
  if ($element.next().length) {
    $element.next().remove();
    return;
  }
  var artist = $element.data('artist');
  $('div.track-list').remove();
  var listing = [];
  listing = listing.concat([
    '<div class="track-list">',
    tracklistArtist(artist),
    '</div>'
  ]);
  $element.after(listing.join(''));
  $element.parent()[0].scrollIntoView();
  $('.track-list').on('click', 'div', trackInfo);
}


function trackInfo(event){
  var $element = $(this).children('p');
  event.stopPropagation();
  if ($element.next().length) {
    $element.next().remove();
    return;
  }
  // remove any open controls
  $element.parent().parent().find('div.track-cmd').remove();
  var track = $element.data('track');
  $element.after('<div data-auto="delete" class="track-cmd"><button data-cmd="add-' + track + '">Play</button></div>');

  $element.next().on('click', 'button', buttonClick);
}


function processAlbumData(data) {
  var albums = data.album;
  var album;
  var lookup = {};
  var i;
  for (i = 0; i < albums.length; i++) {
    album = albums[i];
    lookup[album[0]] = album[1];
  }
  info.album = lookup;
  $.getJSON('track.json', processTrackData);
}


function processTrackData(data) {
  var track;
  var tracks = data.tracks;
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
  $('#menu-toggle').click(toggleMenu);
  $('#page').on('click', 'button', buttonClick);
  resize();
  setInterval(tick, TICK_INTERVAL);
  $.getJSON('artist.json', processArtistData);
});
