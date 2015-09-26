/*global define, gapi */

define(['latin', 'info', 'gapi'], function(latin, info, gapi) {

  function decodeISO8601(str) {
    var parts = str.match(/(\d+)(?=[MHS])/ig) || [];
    var formatted = parts.map(function(item) {
      if (item.length < 2) {
        return '0' + item;
      }
      return item;
    }).join(':');
    return formatted;
  }


  function rank(terms, item){
    var i;
    var r = 1;
    var title = item.title.toLowerCase();
    var description = item.description.toLowerCase();
    var t_w = title.split(' ').length;
    var d_w = description.split(' ').length;
    for (i = 0; i <terms.length; i++){
      if (title.indexOf(terms[i]) > -1){
        if (latin.isStopWord(terms[i])){
          r += 0.2 / t_w;
        } else {
          r += 1 / t_w;
        }
      }
      if (description.indexOf(terms[i]) > -1){
        if (latin.isStopWord(terms[i])){
          r += 0.2 / d_w;
        } else {
          r += 1 / d_w;
        }
      }
    }
    return r;
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
    var terms = q.toLowerCase().split(' ');
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
          id: 'YT:' + id,
          title: item.snippet.title,
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
          dataItem.rank = rank(terms, dataItem);
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
