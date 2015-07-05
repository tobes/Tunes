/*global define */

define('player', ['jquery', 'event', 'queue', 'config'],
  function($, event, queue, config) {

    var players = [];
    var waitlock = false;
    var activePlayer = 0;
    var nextPlayer = 1;
    var current = null;
    var started = false;


    function fadeSteps() {
      return Math.ceil(config.fadeTime / config.tickTime);
    }


    function fadePlayer(player, direction) {
      player.dataset.fade = fadeSteps();
      player.dataset.direction = direction;
    }


    function fadeAction(player) {
      var volume;
      var dataset = player.dataset;
      var direction = dataset.direction;
      var steps = fadeSteps();
      var fade = parseInt(dataset.fade, 10);
      var delta = config.volume / steps;
      if (direction === 'up') {
        volume = (steps - fade) * delta;
      } else {
        volume = fade * delta;
        if (volume < 0) {
          volume = 0;
        }
      }
      if (fade-- === 0) {
        if (direction !== 'up') {
          player.pause();
        }
        dataset.direction = 'none';
      }
      dataset.fade = fade;
      //   console.log('fading', delta, fade, volume, config.fadeSteps - ++fade);
      player.volume = volume;
    }


    function createPlayer() {
      var $player = $('<audio controls data-direction="none">');
      $('body').append($player);
      players.push($player[0]);
    }


    function addTrack(item) {
      var player = players[nextPlayer];
      player.src = item.src;
      player.volume = 0.0;
      fadePlayer(player, 'up');
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


    function nextTrack() {
      if (!players[nextPlayer].paused) {
        console.log('no player ready');
        return;
      }
      fadePlayer(players[activePlayer], 'down');
      queue.get(function(next) {
        waitlock = true;
        addTrack(next);
      });
    }


    function tick() {
      if (!started) {
        if (config.autoPlay){
          queue.get(function(next) {
            addTrack(next);
          });
        }
      } else {
        // have we got near the end of the track?
        var player = players[activePlayer];
        current.duration = player.duration;
        current.position = player.currentTime;

        if ((current.duration - current.position < config.fadeTime / 1000) && !waitlock) {
          nextTrack();
        }
        // anyone fading
        var i;
        for (i = 0; i < players.length; i++) {
          player = players[i];
          if (player.dataset.direction !== 'none') {
            fadeAction(player);
          }
        }
        event.trigger('playingUpdate', current);
      }
    }


    function play() {
      var player = players[activePlayer];
      if (player.paused) {
        player.play();
      }
    }


    function pause() {
      var player = players[activePlayer];
      if (!player.paused) {
        player.pause();
      }
    }


    event.add('controlSkip', nextTrack);
    event.add('controlPlay', play);
    event.add('controlPause', pause);
    event.add('tick', tick);

    // create players
    createPlayer();
    createPlayer();

    console.log('Player: loaded');

    return {};


  });
