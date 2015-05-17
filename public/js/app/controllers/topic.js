define([
    'Marionette',
    'views/topics/details',
    'models/topic'
], function(
    Marionette,
    TopicView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var topic = new Model({_id:id});
            var fetching = topic.fetch();
            fetching.done(function () {
                var view = new TopicView({model:topic});
                App.layout.content.show(view);
            });
        }
    });
    
    return Controller;
});
