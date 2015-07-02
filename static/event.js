/*global define, window */

define(['jquery', 'config'],
  function($, config) {

    var silentEvents = ['tick', 'playingUpdate'];
    var callbacks = {};


    function add(name, callback) {
      // add a callback to an event
      if (!callbacks[name]) {
        callbacks[name] = [];
      }
      callbacks[name].push(callback);
    }


    function trigger(name, data) {
      // trigger an event
      if (callbacks[name] === undefined) {
        console.log('Trigger no user:', name);
        return;
      }
      if (silentEvents.indexOf(name) < 0) {
        console.log('Trigger event:', name);
      }
      var i;
      for (i = 0; i < callbacks[name].length; i++) {
        callbacks[name][i](data);
      }
    }


    function attach(selector) {
      $(selector + ' [data-event]').each(function() {
        $(this).click(function() {
          trigger($(this).data('event'));
        });
      });
    }


    function clock() {
      trigger('tick');
    }


    // exit event
    window.addEventListener('beforeunload', function() {
      console.log('********************************');
      trigger('exit');
      console.log('********************************');
    }, false);

    setInterval(clock, config.tickTime);


    return {
      add: add,
      trigger: trigger,
      attach: attach,
    };

  });
