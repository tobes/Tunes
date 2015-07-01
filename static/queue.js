/*global define */

define('queue',
       ['convert', 'event', 'random'],
       function(convert, event, random) {

  var queue = [];
  var autoMin = 1;

  function setReady(src, id) {
    var i;
    console.log(id);
    for (i = 0; i < queue.length; i++) {
      if (queue[i].id === id) {
        console.log('update queue');
        queue[i].ready = true;
        queue[i].src = src;
      }
    }
    event.trigger('playlistUpdate', queue);
  }

  function queueAdd(item) {
    console.log('queue add', item);
    queue.push({
      type: 'jukebox',
      ready: false,
      id: item.id,
      item: item,
      album: item.pathAlbum,
      artist: item.pathArtist,
      track: item.basename,
      trackNo: '#',
      duration: '-:--',
      art: '',
    });
    convert.convert(item, setReady, item.id);
    event.trigger('playlistUpdate', queue);
  }

  function get(callback) {
    // get next playable item
    var i;
    var item;
    for (i = 0; i < queue.length; i++) {
      if (queue[i].ready) {
        item = queue[i];
        // remove item
        queue.splice(i, 1);
        callback(item);
        event.trigger('playlistUpdate', queue);
      }
    }
  }

  function tick() {
    // add track if needed
    if (queue.length < autoMin) {
    random.randomTrack(function(track){
      console.log('Adding random track');
        queueAdd(track);
    });
    }
  }


  function logQueue() {
    var i;
    var item;
    console.log('Queue ---------');
    for (i = 0; i < queue.length; i++) {
      item = queue[i];
      console.log(i, item.id, item.ready ? 'ready' : 'not ready');
      console.log(item.item.basename);
    }
    console.log('---------------');
  }

//  event.add('playlistUpdate', logQueue);
  event.add('tick', tick);


  console.log('queue loaded');

  return {
    add: queueAdd,
    get: get,
  };

});
