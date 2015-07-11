/*global define, window*/

define(function() {
  //     window.indexedDB.deleteDatabase("tunes");

  var db = null;
  var active = false;
  var activateQueue = [];

  function activation() {
    // process callbacks when db enabled
    var i;
    for (i = 0; i < activateQueue.length; i++) {
      activateQueue[i]();
    }
  }

  var dbOpen = window.indexedDB.open("tunes", 1);

  dbOpen.onerror = function(evt) {
    console.log("Database error: " + evt.target.error.name);
  };

  dbOpen.onsuccess = function(evt) {
    db = evt.target.result;
    console.log('db good');
    active = true;
    activation();
  };

  dbOpen.onupgradeneeded = function(evt) {
    var objectStore;
    db = evt.target.result;

    // Track
    objectStore = db.createObjectStore("track", {
      keyPath: 'id',
      autoIncrement: true
    });
    objectStore.createIndex("path", "path", {
      unique: true
    });

    // Album
    objectStore = db.createObjectStore("album", {
      keyPath: 'id',
      autoIncrement: true
    });
    objectStore.createIndex("path", "path", {
      unique: true
    });

    // Artist
    objectStore = db.createObjectStore("artist", {
      keyPath: 'id',
      autoIncrement: true
    });
    objectStore.createIndex("name", "name", {
      unique: true
    });
    console.log('db updated');
    active = true;
    activation();
  };


  function activate(callback) {
    // db needs to initialise before it's first use
    // we can set callbacks that will then be called
    activateQueue.push(callback);
  }


  function count(store, callback) {
    var transaction = db.transaction([store], "readonly")
      .objectStore(store)
      .count();
    transaction.onsuccess = function() {
      callback(transaction.result);
    };
  }


  function cursor(store, callback) {
    var transaction = db.transaction([store]);
    var request = transaction.objectStore(store).openCursor();
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      console.log("Error", store);
      callback();
    };
  }


  function all(store, filter, callback) {
    var results = [];
    var out;
    var i;
    cursor(store, function(result) {
      if (result) {
        if (filter) {
          out = [];
          for (i = 0; i < filter.length; i++) {
            out.push(result.value[filter[i]]);
          }
          results.push(out);
        } else {
          results.push(result.value);
        }
        result.continue();
      } else {
        callback(results);
      }
    });
  }


  function add(store, data, callback) {
    var transaction = db.transaction([store], "readwrite");
    var request = transaction.objectStore(store).add(data);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      console.log("Error adding " + store);
      callback();
    };
  }



  function put(store, data, callback) {
    var transaction = db.transaction([store], "readwrite");
    var request = transaction.objectStore(store).put(data);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      console.log("Error adding " + store);
      callback();
    };
  }

  function addOrId(store, data, unique, callback) {
    var transaction = db.transaction([store], "readwrite");
    var objStore = transaction.objectStore(store);
    var request = objStore.add(data);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      var index = objStore.index(unique);
      value = data[unique];
      getIndexed(store, unique, value, function(event) {
        callback(event.id);
      });
    };
  }


  function getIndexed(store, index, key, callback) {
    var transaction = db.transaction([store], "readonly");
    var request = transaction.objectStore(store).index(index).get(key);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      console.log("Error");
      callback();
    };
  }


  function get(store, key, callback) {
    var transaction = db.transaction([store], "readonly");
    var request = transaction.objectStore(store).get(key);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
    transaction.onerror = function() {
      console.log("Error");
      callback();
    };
  }


  console.log('database loaded');

  return {
    count: count,
    cursor: cursor,
    get: get,
    put: put,
    add: add,
    addOrId: addOrId,
    all: all,
    activate: activate,
    active: active,
  };

});
