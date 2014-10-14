define([
    'Marionette',
    'hbs!templates/topics/list-item'
], function(
    Marionette,
    Template
    ) {
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'tr',
        
        events: {
            'click .del': function() {
                this.model.destroy();
            },
            'click .voteup': function(e) {
                e.preventDefault();
                $.post('/json/topic-vote',
                       JSON.stringify({'tid':this.model.get('_id')}),
                       function(data,status) {});
            },
            'click .participate': function(e) {
                e.preventDefault();
            },
            'click .edit': function(e) {
                $(".topic-id").val(this.model.get('_id'));
                $(".topic-name").val(this.model.get('name'));
                $(".topic-desc").val(this.model.get('desc'));
                
                $(".lightbox").fadeIn(500);
            },
            // 'click .save': function(e) {
            //     // FIXME this is not being called
            //     e.preventDefault();
            //     this.model.name = this.$(".topic-name").val(),
            //     this.model.desc = this.$(".topic-desc").val(),
                
            //     this.model.save();
            // },
            'click .cancel': function(e) {
                this.$(".lightbox").fadeOut(500);
                this.$(".topic-name").val("");
                this.$(".topic-desc").val("");
            }
        },
        
        initialize: function() {
            Handlebars.registerHelper('ifis', function(a, b, opts) {
                if(a == b) {
                    return opts.fn(this);
                } else {
                    return opts.inverse(this);
                }
            });
        }
    });
    
    return View;
});