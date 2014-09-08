define([
    'Marionette',
    'hbs!templates/topics/list',
    'collections/topics'
    ], function(
    Marionette,
    Template,
    Collection
    ) {
    var topics = new Collection();
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: topics,
        
        events: {
            'click .add': function(e) {
                this.$(".lightbox").fadeIn(500);
            },
            'click .save': function(e) {
                e.preventDefault();
                var Model = this.collection.model;
                var topic = new Model({
                    name: this.$(".save").val()
                });
                topic.save();
                topics.add(topic);
            },
            'click .cancel': function(e) {
                this.$(".lightbox").fadeOut(500);
            }/*,
            'click .lightbox': function(e) {
                this.$(".lightbox").fadeOut(500);
            },
            'click .inner-lightbox': function(e) {
                event.stopPropagation();
            }*/
        },
        
        onBeforeRender: function() {
            topics.fetch();
        }
    });
    
    return View;
});