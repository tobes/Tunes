/*global define, document*/

define(['event', 'config'],
  function(event, config) {

    var ipAddress = [];
    var server;
    var path = require('path');
    var fs = require('fs');
    var url;


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


    function processRequest(request, response) {
      var urlPath = request.url;
      if (urlPath === '/') {
        urlPath = '/index.html';
      }
      var file = path.join('webservice', urlPath);

      console.log('~~~', file);
      var contentType = 'text/html';


      fs.readFile(file, function(error, content) {
        if (error) {
          if (error.code === 'ENOENT') {
            response.writeHead(404);
            response.end('Sorry page not found', 'utf-8');
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


    function startWebservice() {
      if (ipAddress.length === 0) {
        console.log('No IP address webservice not started');
        return;
      }
      var http = require("http");
      var port = config.webservicePort;
      url = 'http://' + ipAddress[0].ip + ':' + port;
      server = http.createServer(processRequest).listen(port);
      console.log('Webservice serving on ' + url);
    }


    function stopServer() {
      if (server) {
        server.close();
        server = null;
        console.log('Webservice exit');
      }
    }


    function getUrl(){
      return url;
    }


    if (config.webserviceActive) {
      event.add('exit', stopServer);
      getIPAdress();
      startWebservice();
    }

    return {
      url: getUrl
    };

  });
