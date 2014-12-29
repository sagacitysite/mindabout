define([
    'Marionette',
    'views/topics/details'
], function(
    Marionette,
    TopicView
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var view = new TopicView({id:id});
            App.layout.content.show(view);
        }
    });
    
    return Controller;
});
