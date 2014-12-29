define([
    'Marionette',
    'hbs!templates/topics/list',
    'views/topics/list-item',
    'collections/topics'
    ], function(
    Marionette,
    Template,
    ItemView,
    Collection
    ) {
    var topics = new Collection();
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: topics,
        
        itemView: ItemView,
        itemViewContainer: '.topic-list',

        events: {
            'click .add': function(e) {
                this.$(".topic-id").val("");
                this.$(".topic-name").val("");
                this.$(".topic-desc").val("");
                
                this.$(".lightbox").fadeIn(500);
            },
            'click .save': function(e) {
                e.preventDefault();
                
                if(this.$(".topic-id").val()) {
                    var topic = topics.get(this.$(".topic-id").val());
                    topic.set({name: this.$(".topic-name").val(), desc: this.$(".topic-desc").val()});
                    topic.save();
                } else {
                    var Model = this.collection.model;
                    var topic = new Model({
                        name: this.$(".topic-name").val(),
                        desc: this.$(".topic-desc").val(),
                    });
                    topic.save({},
                        {success: function(model,response,options) {
                            topic.set(response);
                            topics.add(topic);
                        }.bind(this)
                        });
                    //topic.save();
                    //topic.set({status: 0, level: 0, votes: 0}); // FIXME fix code above
                    //topics.add(topic);
                }
                this.$(".lightbox").fadeOut(500);
                this.render();
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