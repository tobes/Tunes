/*global define, window*/

define(function() {
  // window.indexedDB.deleteDatabase("tunes");

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
    db = evt.target.result;
    var objectStore = db.createObjectStore("track", {
      keyPath: 'id',
      autoIncrement: true
    });
    objectStore.createIndex("path", "path", {
      unique: true
    });
    console.log('db update');
    active = true;
    activation();
  };

  function activate(callback) {
    // db needs to initialise before it's first use
    // we can set callbacks that will then be called
    activateQueue.push(callback);
  }

  function addTrack(data) {
    var transaction = db.transaction(["track"], "readwrite");
    transaction.oncomplete = function() {
      console.log("Track Success");
    };
    transaction.onerror = function() {
      console.log("Track Error");
    };
    return transaction.objectStore("track").add(data);
  }


  function trackcur() {
    var count = 0;
    var transaction = db.transaction(["track"]);
    var dbObjectStore = transaction.objectStore("track");
    var dbCursorRequest = dbObjectStore.openCursor();
    dbCursorRequest.onsuccess = function(evt) {
      var curCursor = evt.target.result;
      if (curCursor) {
        count += 1;
        /* Grab the current employee object from the cursor's value property (we could also grab the key) */
        var track = curCursor.value;
        //      console.log(track.file)
        //    // ...do something with objEmployee...

        // Cause onsuccess to fire again with the next item
        curCursor.continue();
      } // End if
    };
    transaction.oncomplete = function(evt) {
      console.log(count, 'records');
    };
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
    transaction.oncomplete = function() {
      console.log('cursor completed');
    };
  }

  function get(store, key, callback) {
    var transaction = db.transaction([store], "readonly");
    var request = transaction.objectStore(store).get(key);
    request.onsuccess = function(event) {
      callback(event.target.result);
    };
  }

  function trackget() {

      var dbIndex = dbObjectStore.index("EmpName");
      var dbGetRequest = dbIndex.get("Sam Smith");
      dbGetRequest.onsuccess = function(evt) {
        var objEmployee = evt.target.result;
        /* do something with the result */
      }

    }
    //var dbCursorRequest = dbIndex.openCursor();
    //dbCursorRequest.onsuccess = function (evt) {
    //var curCursor = evt.target.result;
    //if (curCursor) {
    ///* Grab the current employee object from the cursor's value property (we could also grab the key). Do something with the object */
    //var objEmployee = curCursor.value;
    //
    //// Cause onsuccess to fire again with the next item
    //curCursor.continue();
    //} // End if
    //}
  console.log('database loaded');

  return {
    addTrack: addTrack,
   // trackcur: trackcur,
    count: count,
    cursor: cursor,
    get: get,
    activate: activate,
    active: active,
  };

});
