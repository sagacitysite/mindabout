define([
    'Marionette',
    'views/login'
], function(
    Marionette,
    LoginView
    ) {
    var Controller = Marionette.Controller.extend({
        route_login_index: function() {
            var view = new LoginView();
            App.layout.content.show(view);
        }
    });
    
    return Controller;
    });
