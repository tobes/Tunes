/*global define */

define(['jquery'], function($) {

  var NAME = 'Tunes!';

  function search(text, callback) {
    $.get('/search/', {
      q: text
    }, function(results) {
      callback(results);
    });
  }

  return {
    search: search,
    name: NAME
  };

});
