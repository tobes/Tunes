/*global requirejs */

requirejs.config({
  baseUrl: 'static',
  paths: {
    jquery: 'vendor/jquery-2.1.4.min',
  }
});

// initialize the database before we do anything
requirejs(['db'], function(db) {
  console.log('==============================');
  db.activate(function() {
    // database is initiated
    console.log('DB ready');
    // start things up
    requirejs(['player', 'interface']);
  });
});
