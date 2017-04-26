/*global requirejs */

requirejs.config({
  baseUrl: 'static',
  paths: {
    jquery: 'vendor/jquery-2.1.4.min',
    gapi: 'https://apis.google.com/js/client.js?onload=googleApiClientReady',
    qrcode: 'vendor/qrcode.min'
  },
  shim: {
    gapi: {
      exports: 'gapi'
    },
    'qrcode': {
      exports: 'QRCode'
    }
  }
});
// initialize the database before we do anything
requirejs(['db', 'event'], function(db, event) {
  // start things up
  requirejs(['player', 'interface', 'import', 'webservice'], function(){
  console.log('calling init');
  event.trigger('init');
  });
});
