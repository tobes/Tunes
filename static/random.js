/*global define */

define(['db'], function(db) {

  var fs = require('fs');


  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  function randomTrack(callback) {
    db.count('track', function(count) {
      var track = getRandomInt(0, count - 1);
      console.log(track);
      db.get('track', track, callback);
    });
  }


  function randomConverted(callback) {
    fs.readdir('converted', function(err, list) {
      var track = parseInt(list[getRandomInt(0, list.length - 1)], 10);
      console.log(track);
      db.get('track', track, callback);
    });
  }


  return {
  //  randomTrack: randomTrack,
    randomTrack: randomConverted,
  };

});
