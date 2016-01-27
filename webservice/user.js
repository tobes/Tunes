/*global define */

define(['jquery'],
  function($) {


    function login(username) {
      $.get('/user/', {
        action: 'login',
        username: username
      }, function(results) {
        console.log(results);
      });

    }

    return {
      login: login
    };

  });
