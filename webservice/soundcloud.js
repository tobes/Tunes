/*global define, gapi */

define(['latin', 'info', 'scapi'], function(latin, info, scapi) {

  var initialized = false;

  function ms2time(ms) {
    var seconds = (ms / 1000) % 60 << 0;
    var minutes = (ms / 1000 / 60) << 0;
    var hours = (ms / 1000 / 60 / 60) << 0;

    var parts = hours ? [hours, minutes, seconds] : [minutes, seconds];
    var formatted = parts.map(function(item) {
      if (item < 10) {
        return '0' + item;
      }
      return item;
    }).join(':');
    return formatted;
  }

  function rank(terms, title, description) {
    title = title || '';
    description = description || '';
    var i;
    var r = 1;
    var t_w = title.split(' ').length;
    var d_w = description.split(' ').length;
    for (i = 0; i < terms.length; i++) {
      if (title.indexOf(terms[i]) > -1) {
        if (latin.isStopWord(terms[i])) {
          r += 0.2 / t_w;
        } else {
          r += 1 / t_w;
        }
      }
      if (description.indexOf(terms[i]) > -1) {
        if (latin.isStopWord(terms[i])) {
          r += 0.2 / d_w;
        } else {
          r += 1 / d_w;
        }
      }
    }
    return r;
  }

  function makeResults(q, result, callback) {
    var i;
    var item;
    var dataItem;
    var terms = q.toLowerCase().split(' ');
    var out = [];
    for (i = 0; i < result.length; i++) {
      item = result[i];
      dataItem = {
        type: 'soundcloud',
        type_desc: 'SoundCloud',
        id: 'SC:' + item.id,
        title: item.title,
        description: item.description,
        duration: ms2time(item.duration),
        user: item.user.username,
        rank: rank(terms, item.title, item.description),
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
