define([
    'Marionette',
    'hbs!templates/layouts/application'
], function(
    Marionette,
    Template
    ) {
    //Template application.html wird beschrieben
    var Layout = Marionette.LayoutView.extend({
        template: Template,
        id: 'wrapper',
        
        regions: {
            'content': '#content'
        }
    });
    
    return Layout;
});