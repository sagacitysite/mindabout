define([
    'Marionette',
    'hbs!templates/topics/details',
    'models/topic'
], function(
    Marionette,
    Template,
    Model
    ) {
        
    var Topic = new Model({_id:this.id});
    //Topic.set('_id',this.id); // FIXME
        
    var View = Marionette.ItemView.extend({
        template: Template,
        model: Topic,
        
        events: {
            'click .del': function(e) {
                this.model.destroy();
            },
            'click .voteup': function(e) {
                $.post('/json/topic-vote',
                       {'tid':this.model.get('_id')},
                       function(data,status) {
                           this.model.set('votes',data);
                           this.render();
                       }.bind(this));
            },
            'click .join': function(e) {
                
            },
            'click .edit': function(e) {
                $(".topic-id").val(this.model.get('_id'));
                $(".topic-name").val(this.model.get('name'));
                $(".topic-desc").val(this.model.get('desc'));
                
                $(".lightbox").fadeIn(500);
            }
        },
        
        onBeforeRender: function() {
            this.model.fetch();
        },
        
        initialize: function() {
            this.model.set('_id',this.id);
            alert(this.id);
        }
    });
    
    return View;
});