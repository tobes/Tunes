/*global define */

define(function() {

  return {
    queueAutoMin: 1,
    queueLimit: 12,

    autoPlay: false,
    fadeTime: 7000,
    tickTime: 100,
    volume: 0.3,

    webservicePort: 1969,
    webserviceActive: 1,
    webserviceSecure: 0,
    webserviceSecureKey: 'ssl/key.pem',
    webserviceSecureCert: 'ssl/cert.pem',

    importAudioExtensions: ['.mp3', '.flac', '.ogg', '.wav'],
    importImageExtensions: ['.jpg', '.png', '.gif'],
    importLimiter: 100,

    ytApiKey: 'AIzaSyALdttsiV7C' + 'mv2fNmDEGmvG6MF4aIHigiA',
  };

});
