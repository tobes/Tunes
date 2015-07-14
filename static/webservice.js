/*global define, document*/

define(['event', 'config', 'db', 'queue'],
  function(event, config, db, queue) {

    var path = require('path');
    var fs = require('fs');
    var qs = require('querystring');

    var ipAddress = [];
    var server;
    var feedCurrent = {};
    var feedQueue = [];
    var queueVersion = 0;
    var messages = [];

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

    var FEEDS = {
      artist: ['id', 'name'],
      album: ['id', 'title', 'artistId', 'art', 'various'],
      track: ['id', 'title', 'artistId', 'albumId', 'trackno'],
    };

    var feedArtist;
    db.all('artist', FEEDS.artist, function(result) {
      feedArtist = result;
    });

    var feedAlbum;
    db.all('album', FEEDS.album, function(result) {
      feedAlbum = result;
    });

    var feedTrack;
    db.all('track', FEEDS.track, function(result) {
      feedTrack = result;
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
      feedCurrent.queue = queueVersion;
    }

    function playlistUpdate(queue) {
      feedQueue = {
        queue: queue,
        version: ++queueVersion,
      };
    }


    function jsonFeed(data) {
      var feed = {
        current: feedCurrent
      };
      if (data.post.queue && data.post.queue < queueVersion) {
        feed.queue = feedQueue;
      }
      return JSON.stringify(feed);
    }


    function jsonData() {
      return JSON.stringify({
        album: feedAlbum,
        artist: feedArtist,
        track: feedTrack,
        feed: FEEDS
      });
    }


    function serveCommand(data) {
      var content = {
        result: 'success'
      };
      var parts = data.match[1].split('-');
      switch (parts[0]) {
        case 'play':
          event.trigger('controlPlay');
          break;
        case 'pause':
          event.trigger('controlPause');
          break;
        case 'skip':
          event.trigger('controlSkip');
          break;
        case 'vol:up':
          event.trigger('controlVolUp');
          break;
        case 'vol:down':
          event.trigger('controlVolDown');
          break;
        case 'add':
          db.get('track', parseInt(parts[1], 10), function(track) {
            if (queue.add(track)) {
              messages.push({
                msg: track[1],
                action: 'added'
              });
            }
          });
          break;
        default:
      }
      return JSON.stringify(content);
    }


    function serveCover(data) {
      var file = path.join('covers', data.match[1]);
      serveFile(file, data.response, data.contentType);
    }

    var routes = [
      ['/data.json', jsonData, '.json'],
      ['/feed.json', jsonFeed, '.json'],
      [/^\/covers\/((\d*)(T.png)?)$/, serveCover, '.png'],
      [/^\/cmd\/(.*)$/, serveCommand, '.json'],
    ];

    function processRequest2(request, response, post) {
      var url = request.url;
      var content;
      var contentType;
      var i;
      var route;
      var found = false;
      var match;
      var data = {
        post: post,
        response: response,
      };
      for (i = 0; i < routes.length; i++) {
        route = routes[i];
        if (typeof route[0] === 'string' && route[0] === url) {
          found = true;
        }
        if (route[0] instanceof RegExp) {
          match = url.match(route[0]);
          if (match) {
            data.match = match;
            found = true;
          }
        }
        if (found) {
          data.contentType = CONTENT_TYPES[route[2] || '.html'];
          content = route[1](data);
          if (content) {
            response.writeHead(200, {
              'Content-Type': data.contentType
            });
            response.end(content, 'utf-8');
          }
          return;
        }
      }
      // static files

      var file;
      if (url[url.length - 1] === '/') {
        url += 'index.html';
      }
      file = path.join('webservice', url);

      var ext = path.extname(url);
      contentType = CONTENT_TYPES[ext];
      serveFile(file, response, contentType);
    }


    function processRequest(request, response) {
      var post;
      if (request.method === 'POST') {
        var data = '';
        request.on('data', function(chunk) {
          data += chunk;
        });
        request.on('end', function() {
          post = qs.parse(data);
          processRequest2(request, response, post);
        });
      } else {
        processRequest2(request, response);
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

      var url = protocol + '://' + ipAddress[0].ip + ':' + port;
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
