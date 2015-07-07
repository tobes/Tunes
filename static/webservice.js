/*global define, document*/

define(['event', 'config', 'db', 'queue'],
  function(event, config, db, queue) {

    var ipAddress = [];
    var server;
    var path = require('path');
    var fs = require('fs');
    var url;
    var feedCurrent = {};
    var feedQueue = [];
    var queueVersion = 0;

    var CONTENT_TYPES = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    };

    var feedArtist;
    db.all('artist', ['id', 'name'], function(result) {
      feedArtist = {
        artists: result
      };
    });

    var feedAlbum;
    db.all('album', ['id', 'title', 'artistId', 'art', 'various'], function(result) {
      feedAlbum = {
        album: result
      };
    });

    var feedTrack;
    db.all('track', ['id', 'title', 'artistId', 'albumId'], function(result) {
      feedTrack = {
        tracks: result
      };
    });

    function getIPAdress() {
      var ifaces = require('os').networkInterfaces();
      Object.keys(ifaces).forEach(function(ifname) {
        ifaces[ifname].forEach(function(iface) {
          if (iface.family === 'IPv4' && iface.internal === false) {
            ipAddress.push({
              ifname: ifname,
              ip: iface.address,
            });
          }
        });
      });
    }


    function serveFile(file, response, contentType) {
      // serve a file
      fs.readFile(file, function(error, content) {
        if (error) {
          if (error.code === 'ENOENT') {
            response.writeHead(404);
            response.end('Sorry page not found');
          } else {
            response.writeHead(500);
            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          }
        } else {
          response.writeHead(200, {
            'Content-Type': contentType
          });
          response.end(content, 'utf-8');
        }
      });
    }


    function playingUpdate(current) {
      feedCurrent = current;
      feedCurrent.queue = queueVersion
    }

    function playlistUpdate(queue) {
      feedQueue = {
        queue: queue,
        version: ++queueVersion,
      };
    }

    function serveJSON(urlPath, response, contentType) {
      var content;
      switch (urlPath) {
        case 'feed.json':
          content = JSON.stringify(feedCurrent);
          break;
        case 'queue.json':
          content = JSON.stringify(feedQueue);
          break;
        case 'album.json':
          content = JSON.stringify(feedAlbum);
          break;
        case 'artist.json':
          content = JSON.stringify(feedArtist);
          break;
        case 'track.json':
          content = JSON.stringify(feedTrack);
          break;
          content = {};
        default:
      }
      response.writeHead(200, {
        'Content-Type': contentType
      });
      response.end(content, 'utf-8');
    }

    function serveCommand(cmd, response, contentType) {
      console.log(cmd);
      var content = {
        result: 'success'
      };
      var data = cmd[1].split('-');
      switch (data[0]) {
        case 'play':
          event.trigger('controlPlay');
          break;
        case 'pause':
          event.trigger('controlPause');
          break;
        case 'skip':
          event.trigger('controlSkip');
          break;
        case 'add':
          db.get('track', parseInt(data[1], 10), function(track) {
            queue.add(track);
          });
          break;
        default:
      }
      response.writeHead(200, {
        'Content-Type': contentType
      });
      response.end(JSON.stringify(content), 'utf-8');
    }

    function processRequest(request, response) {
      var contentType;
      var file;
      var url = request.url;
      var parse = /^\/cmd\/(.*)$/.exec(url);
      if (parse) {
        return serveCommand(parse, response, contentType)
      }
      var parse = /^\/covers\/(\d*)$/.exec(url);
      if (parse) {

        file = path.join('covers', parse[1]);
        contentType = 'image/png';
      } else {
        var urlPath = path.basename(url);
        if (urlPath === '') {
          urlPath = 'index.html';
        }
        var extname = path.extname(urlPath);
        var contentType = CONTENT_TYPES[extname];
      }
      if (extname === '.json') {
        serveJSON(urlPath, response, contentType);
      } else {
        if (!file) {
          file = path.join('webservice', path.sep, urlPath);
        }
        serveFile(file, response, contentType);
      }
    }


    function startWebservice() {
      if (ipAddress.length === 0) {
        console.log('No IP address webservice not started');
        return;
      }
      var port = config.webservicePort;
      var protocol = config.webserviceSecure ? 'https' : 'http';
      if (config.webserviceSecure) {
        var options = {
          key: fs.readFileSync(config.webserviceSecureKey),
          cert: fs.readFileSync(config.webserviceSecureCert)
        };
        var https = require("https");
        server = https.createServer(options, processRequest).listen(port);
      } else {
        var http = require("http");
        server = http.createServer(processRequest).listen(port);
      }

      url = protocol + '://' + ipAddress[0].ip + ':' + port;
      console.log('Webservice serving on ' + url);
    }


    function stopServer() {
      if (server) {
        server.close();
        server = null;
        console.log('Webservice exit');
      }
    }


    function getUrl() {
      return url;
    }


    if (config.webserviceActive) {
      event.add('exit', stopServer);
      event.add('playingUpdate', playingUpdate);
      event.add('playlistUpdate', playlistUpdate);
      getIPAdress();
      startWebservice();
    }



    return {
      url: getUrl
    };

  });
