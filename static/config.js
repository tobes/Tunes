/*global define */

define(function() {

  return {
    queueAutoMin: 2,
    autoPlay: false,
    fadeTime: 7000,
    tickTime: 100,
    volume: 0.3,
    webservicePort: 1969,
    webserviceActive: 1,
    webserviceSecure: 1,
    webserviceSecureKey: 'ssl/key.pem',
    webserviceSecureCert: 'ssl/cert.pem',

    importAudioExtensions: ['.mp3', '.flac', '.ogg', '.wav'],
    importImageExtensions: ['.jpg', '.png', '.gif'],
    importLimiter: 100,
  };

});
