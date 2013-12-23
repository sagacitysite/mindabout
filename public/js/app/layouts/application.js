define([
    'Marionette',
    'hbs!templates/layouts/application'
], function(
    Marionette,
    Template
    ) {
    var Layout = Marionette.Layout.extend({
        template: Template,
        id: 'wrapper',
        
        regions: {
            'main': '.main'
        }
    });
    
    return Layout;
});