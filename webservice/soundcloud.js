/*global define, gapi */

define(['info', 'scapi'], function(info, scapi) {

  var initialized = false;

  var NAME = 'SoundCloud';

  function makeResults(result, callback) {
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
      makeResults(tracks, callback);
    }, function() {
      // failed
      callback([])
    });
  }

  var svg = '<svg width="1792" height="1792" viewBox="-250 0 2292 1792" xm';
  svg += 'lns="http://www.w3.org/2000/svg"><path d="M528 1372l16-241-16-52';
  svg += '3q-1-10-7.5-17t-16.5-7q-9 0-16 7t-7 17l-14 523 14 241q1 10 7.5 1';
  svg += '6.5t15.5 6.5q22 0 24-23zm296-29l11-211-12-586q0-16-13-24-8-5-16-';
  svg += '5t-16 5q-13 8-13 24l-1 6-10 579q0 1 11 236v1q0 10 6 17 9 11 23 1';
  svg += '1 11 0 20-9 9-7 9-20zm-1045-340l20 128-20 126q-2 9-9 9t-9-9l-17-';
  svg += '126 17-128q2-9 9-9t9 9zm86-79l26 207-26 203q-2 9-10 9-9 0-9-10l-';
  svg += '23-202 23-207q0-9 9-9 8 0 10 9zm280 453zm-188-491l25 245-25 237q';
  svg += '0 11-11 11-10 0-12-11l-21-237 21-245q2-12 12-12 11 0 11 12zm94-7';
  svg += 'l23 252-23 244q-2 13-14 13-13 0-13-13l-21-244 21-252q0-13 13-13 ';
  svg += '12 0 14 13zm94 18l21 234-21 246q-2 16-16 16-6 0-10.5-4.5t-4.5-11';
  svg += '.5l-20-246 20-234q0-6 4.5-10.5t10.5-4.5q14 0 16 15zm383 475zm-28';
  svg += '9-621l21 380-21 246q0 7-5 12.5t-12 5.5q-16 0-18-18l-18-246 18-38';
  svg += '0q2-18 18-18 7 0 12 5.5t5 12.5zm94-86l19 468-19 244q0 8-5.5 13.5';
  svg += 't-13.5 5.5q-18 0-20-19l-16-244 16-468q2-19 20-19 8 0 13.5 5.5t5.';
  svg += '5 13.5zm98-40l18 506-18 242q-2 21-22 21-19 0-21-21l-16-242 16-50';
  svg += '6q0-9 6.5-15.5t14.5-6.5q9 0 15 6.5t7 15.5zm392 742zm-198-746l15 ';
  svg += '510-15 239q0 10-7.5 17.5t-17.5 7.5-17-7-8-18l-14-239 14-510q0-11';
  svg += ' 7.5-18t17.5-7 17.5 7 7.5 18zm99 19l14 492-14 236q0 11-8 19t-19 ';
  svg += '8-19-8-9-19l-12-236 12-492q1-12 9-20t19-8 18.5 8 8.5 20zm212 492';
  svg += 'l-14 231q0 13-9 22t-22 9-22-9-10-22l-6-114-6-117 12-636v-3q2-15 ';
  svg += '12-24 9-7 20-7 8 0 15 5 14 8 16 26zm1112-19q0 117-83 199.5t-200 ';
  svg += '82.5h-786q-13-2-22-11t-9-22v-899q0-23 28-33 85-34 181-34 195 0 3';
  svg += '38 131.5t160 323.5q53-22 110-22 117 0 200 83t83 201z"/></svg>';

  return {
    svg: svg,
    name: NAME,
    search: search
  };
});
