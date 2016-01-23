/*global define, gapi */

define(['latin', 'info', 'scapi'], function(latin, info, scapi) {

  var initialized = false;

  function makeResults(q, result, callback) {
    var i;
    var item;
    var dataItem;
    var out = [];
    for (i = 0; i < result.length; i++) {
      item = result[i];
      dataItem = {
        type: 'soundcloud',
        type_desc: 'SoundCloud',
        id: 'SC:' + item.id,
        title: item.title,
        description: item.description,
        duration: (item.duration / 1000 << 0),
        user: item.user.username,
        thumb: item.artwork_url || item.user.avatar_url
      };
      out.push(dataItem);
    }
    callback(out);
  }


  function search(q, callback) {
    if (!initialized) {
      scapi.initialize({
        client_id: info.configGet('soundcloudApiKey')
      });
      initialized = true;
    }
    scapi.get('/tracks', {
      q: q,
      duration: {
        from: 30000,
        to: 600000
      },
      limit: 50
    }).then(function(tracks) {
      makeResults(q, tracks, callback);
    });
  }


  return {
    search: search
  };
});
