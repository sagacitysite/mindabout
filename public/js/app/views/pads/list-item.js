define([
    'Marionette',
    'hbs!templates/pads/list-item'
], function(
    Marionette,
    Template
    ) {
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'li',
        
        events: {
            'click em': function() {
                console.log(this.model.toJSON());
            },
            'click .del': function() {
                this.model.destroy();
            }
        }
    });
    
    return View;
});