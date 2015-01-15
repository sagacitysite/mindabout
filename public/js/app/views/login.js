define([
    'application',
    'Marionette',
    'hbs!templates/login'
    ], function(
    app,
    Marionette,
    Template
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        
        login: function (e) {
            if(this.$("#login-form")) { //.parsley('validate')){
                app.session.login({
                    uid: this.$("#uid").val(),
                    upw: this.$("#upw").val()
                }, {
                    success: function(mod, res){
                        //if(DEBUG) console.log(mod, res);
                    },
                    error: function(mod, res){
                        //if(DEBUG) console.log("ERROR", mod, res);
                    }
                });
                // Redirect
                window.location.href = "#/topics";
            } else {
                // Invalid clientside validations thru parsley
                //if(DEBUG) console.log("Did not pass clientside validation");
            }
        },
    
        events: {
            'keypress #upw': function(e) {
                if (e.which == 13) {
                    this.login(e);
                }
            },
            'click #login': function(e) {
                if(e) e.preventDefault();
                this.login(e);
            }
        },
        
        onShow: function() {
            /*if(app.session.logged_in) {
                console.log('status: logged in');
                $('#status').html('Online');
            }*/
            //console.log('asd');
        }
    });
    
    return View;
});