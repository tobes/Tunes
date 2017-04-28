/*global define */

define(function() {

  var queue = [];
  var config = {};

  function inQueue(trackId) {
    var i;
    for (i = 0; i < queue.length; i++) {
      if (trackId === queue[i].id) {
        return true;
      }
    }
    return false;
  }

  function queueLength() {
    return queue.length;
  }

  function setQueue(data){
    queue = data;
  }

  function configGet(key) {
    return config[key] || 'unknown';
  }

  function configSet(key, value) {
    config[key] = value;
  }

  return {
    setQueue: setQueue,
    inQueue: inQueue,
    queueLength: queueLength,

    configGet: configGet,
    configSet: configSet,
  };

});
