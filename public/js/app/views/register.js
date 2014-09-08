define([
    'application',
    'Marionette',
    'hbs!templates/register',
    'collections/users'
    ], function(
    app,
    Marionette,
    Template,
    Collection
    ) {
    var users = new Collection();

    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: users,
        
        events: {
            'click .register': function(e) {
                if(e) e.preventDefault();
                
                if(this.$("#signup-form")/*.parsley('validate')*/){
                    app.session.signup({
                        uid: this.$("#uid").val(),
                        upw: this.$("#upw").val(),
                        email: this.$("#email").val()
                    }, {
                    success: function(mod, res){
                        console.log(mod);
                    },
                    error: function(mod, res){
                        console.log(mod);
                    }
                });
                } else {
                    // Invalid clientside validations thru parsley
                    console.log("Did not pass clientside validation");
                }
            }
        },
        
        onShow: function() {
            document.getElementById("uid").value=(Math.floor(Math.random()*4294967295)).toString(16).toUpperCase();
        }
    });
    
    return View;
});