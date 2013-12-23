(function() {
  requirejs.config({
    paths: {
      text: '../vendor/text',
      hbs: '../vendor/hbs',
      jquery: '../vendor/jquery.min',
      underscore: '../vendor/underscore-min',
      Backbone: '../vendor/backbone-min',
      Marionette: '../vendor/backbone.marionette.min',
      handlebars: '../vendor/handlebars'
    },
    shim: {
      jquery: {
        exports: 'jQuery'
      },
      underscore: {
        exports: '_'
      },
      Backbone: {
        deps: ['jquery', 'underscore'],
        exports: 'Backbone'
      },
      Marionette: {
        deps: ['jquery', 'underscore', 'Backbone'],
        exports: 'Marionette'
      },
      handlebars: {
        exports: 'Handlebars'
      }
    },
    hbs: {
      disableI18n: true,
      templateExtension: '.html'
    }
  });

  require(['underscore'], function(_) {
    var modules = {
        Pads: 'modules/pads'
    };

    var files_to_load = [
      'application'
    ];

    _.each(modules, function(controller) {
      files_to_load.push(controller);
    });

    require(files_to_load, function(Application) {
      var App = window.App = new Application();
      var module_names = _.keys(modules);

      // initialize modules
      _.each(_.rest(arguments, 1), function(controller, index) {
        App.module(module_names[index], controller);
      });

      App.start();
    });
  })
})();