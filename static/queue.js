/*global define */

define('queue', ['convert', 'event', 'random', 'config', 'db'],
  function(convert, event, random, config, db) {

    var queue = [];
    var queueIds = [];

    function fixId(id){
        return parseInt(id, 10);
    }

    function findIndexForId(id) {
      var i;
      for (i = 0; i < queue.length; i++) {
        if (queue[i].id === id) {
          return i;
        }
      }
      return -1;
    }
    function removeById(id){
      id = fixId(id);
      var index = findIndexForId(id);
      if (index !== -1){
      console.log('delete', id, queue);
        queue = removeIndex(queue, index);
        queueIds = removeIndex(queueIds, index);
      }
      event.trigger('playlistUpdate', queue);
      console.log('delete', queue);
    }

    function setReady(src, id) {
      console.log('set ready ' + id, src);
      if (src === false){
        removeById(id);
        return;
      }
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


    function _queueAdd(item, source) {
      if (!item){
        console.log('no item to add', item);
        return false;
      }
      console.log('queue add', item);
      if (source === 'auto' && queue.length === config.queueAutoMin) {
        return false;
      }
      if (queueIds.indexOf(item.id) !== -1){
        console.log('item already in queue', item);
        return false;
      }

      var art;
      if (item.art){
        art = item.albumId;
      } else {
        art = 0;
      }
      var queueItem = {
        type: 'jukebox',
        ready: false,
        id: item.id,
        item: item,
        album: item.album,
        artist: item.artist,
        track: item.title,
        trackNo: '#',
        duration: '-:--',
        art: art,
        albumId: item.albumId,
        artistId: item.artistId,
      };
      queue.push(queueItem);
      queueIds.push(item.id);
      convert.convert(item, setReady, item.id);
      return queueItem;
    }

    function queueAdd(item, source) {
      var queueItem = _queueAdd(item, source);
      if (queueItem){
        event.trigger('playlistUpdate', queue);
        event.trigger('playlistTrackAdded', queueItem);
      }
    }


    function removeIndex(list, index) {
      var i;
      var out = [];
      for (i = 0; i < list.length; i++) {
        if (i !== index) {
          out.push(list[i]);
        }
      }
      return out;
    }


    function get(callback) {
      // get next playable item
      var i;
      var item;
      for (i = 0; i < queue.length; i++) {
        if (queue[i].ready) {
          item = queue[i];
          // remove item
          queue = removeIndex(queue, i);
          queueIds = removeIndex(queueIds, i);
          callback(item);
          event.trigger('playlistUpdate', queue);
          break;
        }
      }
    }

    function addTrackById(id) {
      id = fixId(id);
      db.get('track', id, function(track) {
        queueAdd(track);
      });
    }

    function addAlbumById(id) {
      id = fixId(id);
      db.get('album', id, function(album) {
        db.getKeys(
          'track',
          album.tracks.split(',').map(Number),
          function(tracks){
            var i;
            for (i=0; i < tracks.length; i++){
              _queueAdd(tracks[i]);
            }
            event.trigger('playlistUpdate', queue);
            event.trigger('playlistAlbumAdded', album);
          }
        );
      });
    }

    function tick() {
      // add track if needed
      if (queue.length < config.queueAutoMin) {
        random.randomTrack(function(track) {
          console.log('Adding random track');
          queueAdd(track, 'auto');
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
      removeById: removeById,
      addTrackById: addTrackById,
      addAlbumById: addAlbumById,
      get: get,
    };

  });
