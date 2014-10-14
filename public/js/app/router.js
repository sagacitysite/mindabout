/**
 * @desc        backbone router for pushState page routing
 */

define([
    "application",
    "BackboneRouteFilter"
], function(app,BackboneRouteFilter){

    var AuthRouter = Backbone.Router.extend({

        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },
        
        before: function( route, params ){
            //return true;
            
            if((app && app.session.get('logged_in')) ||
               route == 'login' || route == 'register')
                return true;
            
            this.navigate('login',true);
            return false;
        }

    });

    return AuthRouter;

});
