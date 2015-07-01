/*global define */

define('tunes', ['player', 'playing'], function (player, playing) {
  console.log('tunes loaded');

  function init(){
 // player.add('audio/moo2.ogg');
  };


  return {
    init: init,
  };
});

