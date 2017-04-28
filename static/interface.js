/*global define */

define(['jquery', 'webservice'],
  function($, webservice) {


    function init() {
      // initialise the base user interface
      $('body').append('<div id="content"><iframe src="' + webservice.url() + '"></iframe></div>');
    }

    init();

    return {};

  });
