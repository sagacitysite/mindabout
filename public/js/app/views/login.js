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
        
        events: {
            'click #login': function(evt) {
                //if(evt) evt.preventDefault();
                
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
                } else {
                    // Invalid clientside validations thru parsley
                    //if(DEBUG) console.log("Did not pass clientside validation");
                }
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