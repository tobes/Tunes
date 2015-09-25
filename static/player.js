/*global define */

define('player', ['jquery', 'event', 'queue', 'config'],
  function($, event, queue, config) {

    var players = [];
    var waitlock = false;
    var activePlayer = 0;
    var nextPlayer = 1;
    var current = {};
    var started = false;
    var masterVolume = config.volume;


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
      var delta = masterVolume / steps;
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


    function durationChange(e){
      if (e.target === players[activePlayer]){
        current.duration = e.target.duration;
        event.trigger('playerChange', current);
      }
    }


    function createPlayer() {
      var $player = $('<audio controls data-direction="none">');
      $player[0].ondurationchange = durationChange;
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

      current.item = item;
      current.position = 0;

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
      current.paused = players[activePlayer].paused;
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
      }
      event.trigger('playingUpdate', current);
    }


    function play() {
      if (current.item){
        var player = players[activePlayer];
        if (player.paused) {
          player.play();
          current.paused = false;
          event.trigger('playerChange', current);
        }
      } else {
        nextTrack();
      }
    }


    function pause() {
      var player = players[activePlayer];
      if (!player.paused) {
        player.pause();
        current.paused = true;
        event.trigger('playerChange', current);
      }
    }

    function setVol(){
      var player = players[activePlayer];
      if (player.dataset.direction === 'none'){
        player.volume = masterVolume;
      }
      console.log('vol ' + masterVolume);
    }

    function volUp(){
      masterVolume += 0.05;
      if (masterVolume > 1.0){
        masterVolume = 1.0;
      }
      setVol();
    }


    function volDown(){
      masterVolume -= 0.05;
      if (masterVolume < 0.0){
        masterVolume = 0.0;
      }
      setVol();
    }

    function getVolume(){
      return Math.round(masterVolume * 100);
    }

    function init(){
      // create players
      createPlayer();
      createPlayer();
      event.add('tick', tick);
      event.add('controlSkip', nextTrack);
      event.add('controlPlay', play);
      event.add('controlPause', pause);
      event.add('controlVolUp', volUp);
      event.add('controlVolDown', volDown);
    }


    event.add('init', init);

    console.log('Player: loaded');

    return {
      getVolume: getVolume,
      'current': function(){return current;}
    };


  });
