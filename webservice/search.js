/*global define */

define(['latin'],
  function(latin) {


    var modulesInfo = {};
    var initialized = false;
    var modules = ['youtube', 'soundcloud', 'jukebox'];

    function loadModule(name, callback) {
      require([name], function(module) {
        modulesInfo[name] = {
          module: module,
          active: true,
          name: module.name,
          svg: module.svg || '',
          search: module.search
        };
        callback();
      });
    }
    function init() {
      var i;

      function allLoaded() {
        if (Object.keys(modulesInfo).length === modules.length) {
          initialized = true;
        }
      }

      for (i = 0; i < modules.length; i++) {
        loadModule(modules[i], allLoaded);
      }
    }

    function svg(type) {
      var module = modulesInfo[type];
      return module ? module.svg : '';
    }


    function rank(terms, item) {
      var i;
      var j;
      var field;
      var weight;
      var r = 0;
      var fields = [
        ['title', 1],
        ['description', 0.5],
        ['album', 1],
        ['artist', 1]
      ];
      var test;
      var t_w;
      var count = 0;
      var found;
      var numTerms = terms.length;
      for (i = 0; i < numTerms; i++) {
        found = false;
        for (j = 0; j < fields.length; j++) {
          field = fields[j][0];
          weight = fields[j][1];
          test = item[field];
          if (test) {
            test = test.toLowerCase();
            t_w = test.split(' ').length;
            if (test.indexOf(terms[i]) > -1) {
              if (latin.isStopWord(terms[i])) {
                r += (0.2 / t_w) * weight;
                found = true;
              } else {
                r += (1 / t_w) * weight;
                found = true;
              }
            }
          }
        }
        if (found) {
          count += 1;
        }
      }
      if (numTerms) {
        r += 1.0 * (count / numTerms);
      }
      return r;
    }

    function rankResults(q, results) {
      var i;
      var item;
      var terms = q.toLowerCase().split(' ');
      for (i = 0; i < results.length; i++) {
        item = results[i];
        item.rank = rank(terms, item);
      }
      // sort into ranked order
      results.sort(function(a, b) {
        return b.rank - a.rank;
      });

    }

    function makeResults(results, text, callback) {
      // check we have all the results
      var i;
      if (results.length !== modules.length) {
        return;
      }
      // merge into single result list
      var flattened = [];
      for (i = 0; i < results.length; ++i) {
        flattened = flattened.concat(results[i]);
      }
      rankResults(text, flattened);
      callback(flattened);
    }

    function search(text, callback) {
      if (!initialized) {
        setTimeout(function() {
          search(text, callback);
        }, 100);
        return;
      }
      var i;
      var results_list = [];
      var module;

      var fn = function (results) {
        results_list.push(results);
        makeResults(results_list, text, callback);
      };
      for (i = 0; i < modules.length; i++) {
        module = modulesInfo[modules[i]];
        module.search(text, fn);
      }
    }

    function isInitialized(){
      return initialized;
    }

    init();

    return {
      search: search,
      svg: svg,
      initialized: isInitialized
    };

  });
