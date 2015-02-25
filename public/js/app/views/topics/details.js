define([
    'Marionette',
    'hbs!templates/topics/details'
], function(
    Marionette,
    Template
    ) {
        
    var ht = 0;
        
    var View = Marionette.ItemView.extend({
        template: Template,

        events: {
            'click .open-desc': function(e) {
                //alert(ht);
                $('.desc').animate({height: ht + 'px'}, 500 );
                $('.open-desc').slideUp(250);
            },
            'click .del': function(e) {
                if (confirm('Do you really want to delete the topic "'+this.model.get('name')+'"?')) {
                    this.model.destroy();
                    window.location.href='/#/topics';
                }
            },
            'click .vote': function(e) {
                e.preventDefault();
                
                if(this.model.get('voted')) {
                    // if we have already voted then unvote
                    $.post('/json/topic-unvote',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('votes',data);
                               this.model.set('voted',0);
                               this.render();
                           }.bind(this));
                } else {
                    $.post('/json/topic-vote',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('votes',data);
                               this.model.set('voted',1);
                               this.render();
                           }.bind(this));
                }
            },
            'click .join': function(e) {
                e.preventDefault();
                
                if(this.model.get('joined')) {
                    // if we have already joined then unjoin (leave after join)
                    $.post('/json/topic-unjoin',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('participants',data);
                               this.model.set('joined',0);
                               this.render();
                           }.bind(this));
                } else {
                    $.post('/json/topic-join',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('participants',data);
                               this.model.set('joined',1);
                               this.render();
                           }.bind(this));
                }
            }
        },
        
        initialize: function() {
            var that = this;
            var fetching = this.model.fetch();
            fetching.done(function() {that.render();});
            
            Handlebars.registerHelper('ifis', function(a, b, opts) {
                if(a == b) {
                    return opts.fn(this);
                } else {
                    return opts.inverse(this);
                }
            });
        },
        
        onRender: function() {
            ht = $('.desc').height();
            if(ht > 300) {
                $('.desc').height(200);
                $(".open-desc").css("display", "block");
            }
        }
    });
    
    return View;
});