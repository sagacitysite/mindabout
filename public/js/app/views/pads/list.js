define([
    'Marionette',
    'hbs!templates/pads/list',
    'views/pads/list-item',
    'collections/pads'
    ], function(
    Marionette,
    Template,
    ItemView,
    Collection
    ) {
    var pads = new Collection();
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: pads,
        
        itemView: ItemView,
        itemViewContainer: '.pad-list',
        
        events: {
            'click .add': function(e) {
                e.preventDefault();
                var Model = this.collection.model;
                var pad = new Model({
                    name: this.$('[name=new-pad-name]').val()
                });
                pad.save();
                pads.add(pad);
            }
        },
        
        onBeforeRender: function() {
            pads.fetch();
        }
    });
    
    return View;
});