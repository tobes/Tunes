/*global define, document*/

define(['event', 'config', 'search_index', 'queue', 'player'],
  function(event, config, search_index, queue, player) {

    var path = require('path');
    var fs = require('fs');
    var qs = require('querystring');

    var currentStreamId = 0;
    var ipAddress = [];
    var server;
    var feedQueue = [];
    var url;

    var CONTENT_TYPES = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.webapp': 'application/x-web-app-manifest+json',
    };

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

    var streams = {};

    function message(response, type, msg){
      response.write('event: ' + type + '\ndata: ' + msg + '\n\n');
    }

    function msgBuild(text, name){
      var message = {text: text}
      if (name){
        message.name = name;
      }
      return JSON.stringify({text: message});
    }

    function messageStream(type, msg, streamId){
      if (streamId){
        if (streams[streamId]){
          message(streams[streamId], type, msg);
        }
        return;
      }
      var stream;
      for (stream in streams){
        if (streams.hasOwnProperty(stream)){
          message(streams[stream], type, msg);
        }
      }
    }

    function msg(text, name, streamId){
      // quick messaging helper
      messageStream('message', msgBuild(text, name), streamId);
    }

    function configSet(key, value, streamId){
      var m = JSON.stringify({key: key, value: value});
      messageStream('config', m, streamId);
    }


    function registerStream(streamId, response){
      streams[streamId] = response;
      message(response, 'current', JSON.stringify(player.current()));
      message(response, 'queue', JSON.stringify(feedQueue));
      configSet('queueLimit', queue.getLimit(), streamId);
      configSet('ytApiKey', config.ytApiKey, streamId);
      configSet('soundcloudApiKey', config.soundcloudApiKey, streamId);
      message(response, 'init', '');
    }

    function clearStream(streamId){
      delete streams[streamId];
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


    function playerChange(current) {
      messageStream('current',JSON.stringify(current));
    }

    function playlistUpdate(queue) {
      feedQueue = queue;
      messageStream('queue',JSON.stringify(queue));
    }


    function playlistTrackAdded(track) {
      if (track.track){
        messageStream(
          'message',
          msgBuild(track.track + ' added', 'added')
        );
      } else if (track.title){
        messageStream(
          'message',
          msgBuild(track.title + ' added', 'added')
        );
      }
    }

    function playlistAlbumAdded(album) {
      if (album.title){
        messageStream(
          'message',
          msgBuild(album.artist + ' ' + album.title + ' added', 'added')
        );
      }
    }

    function serveSearch(data) {
      console.log(data.get.q);
      var results = search_index.search(data.get.q);
      console.log(results);
      return JSON.stringify(results);
    }


    function serveCommand(data) {
      var content = {
        result: 'success'
      };
      var streamId = data.get.streamId;
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
          msg('Volume ' + player.getVolume() + '%', 'volume', streamId);
          break;
        case 'vol:down':
          event.trigger('controlVolDown');
          msg('Volume ' + player.getVolume() + '%', 'volume', streamId);
          break;
        case 'limit:up':
          event.trigger('queueLimitUp');
          msg('Limit ' + queue.getLimit(), 'limit', streamId);
          configSet('queueLimit', queue.getLimit());
          break;
        case 'limit:down':
          event.trigger('queueLimitDown');
          msg('Limit ' + queue.getLimit(), 'limit', streamId);
          configSet('queueLimit', queue.getLimit());
          break;
        case 'add':
          queue.addTrackById(parts[1]);
          break;
        case 'delete':
          queue.removeById(parts[1]);
          break;
        case 'album':
          queue.addAlbumById(parseInt(parts[1], 10));
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
      [/^\/covers\/(\d*T?.png)$/, serveCover, '.png'],
      [/^\/cmd\/(.*)$/, serveCommand, '.json'],
      [/^\/search\/$/, serveSearch, '.json'],
    ];

    function processRequest2(request, response, get, post) {
      var url = request.url;
      var content;
      var contentType;
      var i;
      var route;
      var found = false;
      var match;
      var data = {
        get:get,
        post: post,
        response: response,
        request: request,
      };
      if (url === "/stream") {
        response.writeHead(
          200, {
            "Content-Type":"text/event-stream;charset=UTF-8",
            "Cache-Control":"no-cache",
            "Connection":"keep-alive"
          }
        );
        response.write("retry: 1000\n");
        var streamId = ++currentStreamId;
        response.write("event: stream_id\n");
        response.write("data: " + streamId + "\n\n");
        registerStream(streamId, response);

        request.connection.addListener("close", function () {
          clearStream(streamId);
        }, false);
        return;
      }
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
      console.log(file)
      console.log(url)

      var ext = path.extname(url);
      contentType = CONTENT_TYPES[ext];
      serveFile(file, response, contentType);
    }


    function processRequest(request, response) {
      var post;
      var split = request.url.split('?');
      request.url = split[0];
      var get = qs.parse(split[1] || '');
      if (request.method === 'POST') {
        var data = '';
        request.on('data', function(chunk) {
          data += chunk;
        });
        request.on('end', function() {
          post = qs.parse(data);
          processRequest2(request, response, get, post);
        });
      } else {
        processRequest2(request, response, get);
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
      event.add('playerChange', playerChange);
      event.add('playlistUpdate', playlistUpdate);
      event.add('playlistTrackAdded', playlistTrackAdded);
      event.add('playlistAlbumAdded', playlistAlbumAdded);
      getIPAdress();
      startWebservice();
    }



    return {
      url: getUrl
    };

  });
