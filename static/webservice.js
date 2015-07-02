/*global define, document*/

define(['event', 'config'],
  function(event, config) {

    var ipAddress = [];
    var server;
    var path = require('path');
    var fs = require('fs');
    var url;
    var feed = {current: {}};

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
      feed.current = current;
    }


    function serveJSON(urlPath, response, contentType) {
      var content = JSON.stringify(feed);
      response.writeHead(200, {
        'Content-Type': contentType
      });
      response.end(content, 'utf-8');
    }


    function processRequest(request, response) {
      console.log('Webserver request', request.url);
      var urlPath = path.basename(request.url);
      if (urlPath === '') {
        urlPath = 'index.html';
      }
      var extname = path.extname(urlPath);
      var contentType = CONTENT_TYPES[extname];

      if (extname === '.json') {
        serveJSON(urlPath, response, contentType);
      } else {
        var file = path.join('webservice', path.sep, urlPath);
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
      getIPAdress();
      startWebservice();
    }

    return {
      url: getUrl
    };

  });
