/*global requirejs */

requirejs.config({
  baseUrl: 'static',
  paths: {
    jquery: 'vendor/jquery-2.1.4.min',
    qrcode: 'vendor/qrcode.min'
  },
  shim: {
    'qrcode': {
      exports: 'QRCode'
    }
  }
});

// initialize the database before we do anything
requirejs(['db', 'event'], function(db, event) {
  console.log('==============================');
  db.activate(function() {
    // database is initiated
    console.log('DB ready');
    // start things up
    requirejs(['player', 'interface', 'import', 'webservice'], function(){
    console.log('init ready');
    event.trigger('init');
    });

  });
});
