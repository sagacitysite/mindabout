define([
    'Marionette',
    'hbs!templates/groups/details',
    'models/group'
], function(
    Marionette,
    Template,
    Model
    ) {
        
    var Group = new Model({_id:this.id});
        
    var View = Marionette.ItemView.extend({
        template: Template,
        model: Group,
        
        events: {
            
        },
        
        onBeforeRender: function() {
            this.model.fetch();
        }
    });
    
    return View;
});