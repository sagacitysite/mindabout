define([
    'jquery',
    'Marionette',
    'etherpad',
    'hbs!templates/topics/details',
    'jquerycookie',
    'jquerycountdown'
], function(
    $,
    Marionette,
    etherpad,
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
                alert($.cookie('uid'));
                
                if (confirm('Do you really want to delete the topic "'+this.model.get('name')+'"?')) {
                    this.model.destroy({success: function(model, res) {
                        if(!res.deleted)
                            alert('Only the owner can delete the topic!');
                    }});
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
            
            $.get('https://beta.etherpad.org/p/dhfghfg/export/html',
               {},
               function(data,status) {
                var str = data.replace(/\r?\n/g, "");
                var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
                $('#descriptionPad').html(body);
             });
             
             $('#timeremaining').countdown('2015/05/20', function(event) {
               $(this).html(event.strftime('%D:%H:%M:%S'));
             });

            /*$('#descriptionPad').pad(
                {'height' : 400,
                 'noColors' : true,
                 'borderStyle' : 'none',
                 'padId':this.model.get('_id')
            });*/
        }
    });
    
    return View;
});