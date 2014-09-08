define([
  'jquery',
  'Marionette',
  'layouts/application'
], function (
  $,
  Marionette,
  AppLayout
  ) {
    
  // will be overwritten by main
  var Router = Marionette.AppRouter.extend();
  
  var Application = Marionette.Application.extend({
    layout: new AppLayout(),
    router: new Router(),
    
    // TODO wie in 4-backbone-login-master/public/router.js
    
    // NOTE we cannot create session here because it does JSON calls
    //session: new Session(),

    onStart: function() {
        $('body').prepend(App.layout.render().el);
        //Backbone.history.start({ pushState: false, root: '/' });
        
        $('#loading').fadeOut(500);
    }
  });
  
    $.ajaxSetup({ cache: false });          // force ajax call on all browsers

    // Global event aggregator
    Application.eventAggregator = _.extend({}, Backbone.Events);

  return Application;
});