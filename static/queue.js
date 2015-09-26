/*global define */

define('queue', ['convert', 'event', 'random', 'config', 'db', 'youtube'],
  function(convert, event, random, config, db, youtube) {

    var queue = [];
    var queueIds = [];
    var queueLimit = config.queueLimit;

    function fixId(id){
      if (/^YT:/.test(id)){
        return id;
      } else {
        return parseInt(id, 10);
      }
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
      if (queueIds.length >= queueLimit) {
        console.log('queue is full', item);
        return false;
      }
      queue.push(item);
      queueIds.push(item.id);
      return true;
    }

    function queueAddLocal(item, source) {
      if (!item){
        console.log('no item to add', item);
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
        album: item.album,
        artist: item.artist,
        track: item.title,
        trackNo: item.trackno,
        duration: item.duration,
        art: art,
        albumId: item.albumId,
        artistId: item.artistId,
      };

      if (_queueAdd(queueItem)){
        convert.convert(item, setReady, item.id);
        return queueItem;
      }
    }

    function queueAdd(item, source) {
      var queueItem = queueAddLocal(item, source);
      if (queueItem){
        event.trigger('playlistUpdate', queue);
        event.trigger('playlistTrackAdded', queueItem);
      }
    }

    function addYoutube(id){
      youtube.getInfo(id, function(item) {
        console.log('Youtube');
        console.log(item);
        if (item){
          if (_queueAdd(item)) {
            youtube.downloadYouTubeAudio(id, setReady, id);
            event.trigger('playlistTrackAdded', item);
          }
          event.trigger('playlistUpdate', queue);
        }
      });

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
      if (/^YT:/.test(id)){
        addYoutube(id);
        return;
      }
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
              queueAddLocal(tracks[i]);
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

    function queueLimitUp() {
      queueLimit++;
    }

    function queueLimitDown() {
      queueLimit--;
      if (queueLimit < 1){
        queueLimit = 1;
      }
    }

    function getLimit(){
      return queueLimit;
    }

    event.add('tick', tick);
    event.add('queueLimitUp', queueLimitUp);
    event.add('queueLimitDown', queueLimitDown);


    console.log('queue loaded');

    return {
      add: queueAdd,
      removeById: removeById,
      addTrackById: addTrackById,
      addAlbumById: addAlbumById,
      get: get,
      getLimit: getLimit,
    };

  });
