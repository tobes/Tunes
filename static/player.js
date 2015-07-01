/*global define */

define('player', ['jquery', 'event', 'queue'], function($, event, queue) {
  var players = [];
  var waiting = true;
  var waitlock = false;
  var activePlayer = 0;
  var nextPlayer = 1;
  var current = null;
  var fadeTime = 10;
  var started = false;

  function createPlayer() {
    var $player = $('<audio controls>');
    $('body').append($player);
    players.push($player[0]);
  }

  // create players
  createPlayer();
  createPlayer();

  function addTrack(item) {
    var player = players[nextPlayer];
    player.src = item.src;
    waiting = false;
    player.volume = 0.2;
    player.play();
    activePlayer = nextPlayer;
    nextPlayer += 1;
    if (nextPlayer >= players.length) {
      nextPlayer = 0;
    }
    current = {
      item: item
    };
    waitlock = false;
    started = true;
    console.log('add track', item.src);
    event.trigger('playingChange', current);
  }

  function tick() {
    if (!started) {
      queue.get(function(next) {
        addTrack(next);
      });
    } else {
      var player = players[activePlayer];
      current.duration = player.duration;
      current.position = player.currentTime;

      if ((current.duration - current.position < fadeTime) && !waitlock) {
        waitlock = true;
        queue.get(function(next) {
          addTrack(next);
        });
      }

      event.trigger('playingUpdate', current);
    }
  }


  //event.add('playlistUpdate', playlistUpdate);
  event.add('tick', tick);

  console.log('Player: loaded');

  return {};


});
