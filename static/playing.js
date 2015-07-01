define(['jquery', 'player'], function ($, player) {


function formatTime(time){
  time = Math.floor(time);
  var seconds = time % 60;
  time = (time - seconds)/60;
  if (seconds < 10){
    seconds = '0' + seconds;
  }
  var mins = time % 60;
  time = (time - mins)/60;
  return mins + ':' + seconds;

}

function update() {
  var active = player.active()
  $('.time').text(formatTime(active.currentTime));
  $('.duration').text(formatTime(active.duration));
}

// setInterval(update, 100);

  $.get( "html/playing.html", function( data ) {
    $("body").append(data);
  });
console.log('Playing: loaded');


});
