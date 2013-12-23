define([
  'Marionette',
  'layouts/application'
], function (
  Marionette,
  AppLayout
  ) {
  var Router = Marionette.AppRouter.extend();

  var Application = Marionette.Application.extend({
    router: new Router(),
    layout: new AppLayout(),

    onStart: function() {
      $('body').prepend(App.layout.render().el);
      Backbone.history.start({ pushState: false, root: '/' });
    }
  });

  return Application;
});