/*global define, setTimeout */

define(['info', 'gapi'], function(info, gapi) {

  var NAME = 'YouTube';

  function decodeISO8601(str) {
    var parts = str.match(/(\d+)(?=[MHS])/ig) || [];
    parts.reverse();
    return (
      ((parseInt(parts[2], 10) || 0) * 3600) + ((parseInt(parts[1], 10) || 0) * 60) + ((parseInt(parts[0], 10) || 0))
    );
  }

  function makeRequest(q, callback) {
    // basic info
    var i;
    var item;
    var items;
    var id;
    var request = gapi.client.youtube.search.list({
      q: q,
      type: 'video',
      maxResults: 50,
      part: 'snippet'
    });
    request.execute(function(response) {
      var ids = [];
      var data = {};
      items = response.items;
      for (i = 0; i < items.length; i++) {
        item = items[i];
        id = item.id.videoId;
        ids.push(id);
        data[id] = {
          type: 'youtube',
          type_desc: 'YouTube',
          id: 'YT:' + id,
          title: item.snippet.title,
          user: item.snippet.channelTitle,
          description: item.snippet.description,
          thumb: item.snippet.thumbnails.default.url
        };
      }
      // duration
      request = gapi.client.youtube.videos.list({
        id: ids.join(','),
        part: 'contentDetails'
      });
      request.execute(function(response) {
        var duration;
        var out = [];
        var dataItem;
        items = response.items;
        for (i = 0; i < items.length; i++) {
          item = items[i];
          id = item.id;
          duration = decodeISO8601(item.contentDetails.duration);
          dataItem = data[id];
          dataItem.duration = duration;
          out.push(dataItem);
        }
        callback(out);
      });


    });
  }

  function search(q, callback) {
    // check gapi is initialised
    if (!gapi.client) {
      setTimeout(function() {
        search(q, callback);
      }, 100);
    } else {
      gapi.client.setApiKey(info.configGet('ytApiKey'));
      gapi.client.load('youtube', 'v3', function() {
        makeRequest(q, callback);
      });
    }
  }

  var svg = '<svg width="1792" height="1792" viewBox="0 0 1792 1792" xmlns';
  svg += '="http://www.w3.org/2000/svg"><path d="M1099 1244v211q0 67-39 67';
  svg += '-23 0-45-22v-301q22-22 45-22 39 0 39 67zm338 1v46h-90v-46q0-68 4';
  svg += '5-68t45 68zm-966-218h107v-94h-312v94h105v569h100v-569zm288 569h8';
  svg += '9v-494h-89v378q-30 42-57 42-18 0-21-21-1-3-1-35v-364h-89v391q0 4';
  svg += '9 8 73 12 37 58 37 48 0 102-61v54zm429-148v-197q0-73-9-99-17-56-';
  svg += '71-56-50 0-93 54v-217h-89v663h89v-48q45 55 93 55 54 0 71-55 9-27';
  svg += ' 9-100zm338-10v-13h-91q0 51-2 61-7 36-40 36-46 0-46-69v-87h179v-';
  svg += '103q0-79-27-116-39-51-106-51-68 0-107 51-28 37-28 116v173q0 79 2';
  svg += '9 116 39 51 108 51 72 0 108-53 18-27 21-54 2-9 2-58zm-608-913v-2';
  svg += '10q0-69-43-69t-43 69v210q0 70 43 70t43-70zm719 751q0 234-26 350-';
  svg += '14 59-58 99t-102 46q-184 21-555 21t-555-21q-58-6-102.5-46t-57.5-';
  svg += '99q-26-112-26-350 0-234 26-350 14-59 58-99t103-47q183-20 554-20t';
  svg += '555 20q58 7 102.5 47t57.5 99q26 112 26 350zm-998-1276h102l-121 3';
  svg += '99v271h-100v-271q-14-74-61-212-37-103-65-187h106l71 263zm370 333';
  svg += 'v175q0 81-28 118-37 51-106 51-67 0-105-51-28-38-28-118v-175q0-80';
  svg += ' 28-117 38-51 105-51 69 0 106 51 28 37 28 117zm335-162v499h-91v-';
  svg += '55q-53 62-103 62-46 0-59-37-8-24-8-75v-394h91v367q0 33 1 35 3 22';
  svg += ' 21 22 27 0 57-43v-381h91z"/></svg>';

  return {
    svg: svg,
    name: NAME,
    search: search
  };

});
