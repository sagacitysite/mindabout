define([
    'Marionette',
    'hbs!templates/topics/details'
], function(
    Marionette,
    Template
    ) {
        
    var View = Marionette.ItemView.extend({
        template: Template,

        // events: {
        //     'click .del': function(e) {
        //         this.model.destroy();
        //     },
        //     'click .voteup': function(e) {
        //         $.post('/json/topic-vote',
        //               {'tid':this.model.get('_id')},
        //               function(data,status) {
        //                   this.model.set('votes',data);
        //                   this.render();
        //               }.bind(this));
        //     },
        //     'click .join': function(e) {
                
        //     },
        //     'click .edit': function(e) {
        //         $(".topic-id").val(this.model.get('_id'));
        //         $(".topic-name").val(this.model.get('name'));
        //         $(".topic-desc").val(this.model.get('desc'));
                
        //         $(".lightbox").fadeIn(500);
        //     }
        // },
        
        initialize: function() {
            var that = this;
            var fetching = this.model.fetch();
            fetching.done(function() {that.render();});
        }
    });
    
    return View;
});