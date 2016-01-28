/*global define */

define(['db'], function(db) {

  var fs = require('fs');


  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  function randomTrack(callback) {
    db.count('track', function(count) {
      var id = getRandomInt(0, count - 1);
      console.log('random track', id);
      callback(id);
    });
  }


  function randomConverted(callback) {
    fs.readdir('converted', function(err, list) {
      var id = list[getRandomInt(0, list.length - 1)];
      id = id.split('.')[0];
      console.log('random converted', id);
      callback(id);
    });
  }


  return {
   randomTrack: randomTrack,
 //  randomTrack: randomConverted,
  };

});
