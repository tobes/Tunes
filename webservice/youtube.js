/*global define, gapi */

define(['latin', 'info', 'gapi'], function(latin, info, gapi) {

  function decodeISO8601(str) {
    var parts = str.match(/(\d+)(?=[MHS])/ig) || [];
    parts.reverse();
    return (
      ((parseInt(parts[2], 10) || 0) *3600)
      + ((parseInt(parts[1] , 10)|| 0) *60)
      + ((parseInt(parts[0], 10) || 0))
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
    gapi.client.setApiKey(info.configGet('ytApiKey'));
    gapi.client.load('youtube', 'v3', function() {
      makeRequest(q, callback);
    });
  }


  return {
    search: search
  };

});
