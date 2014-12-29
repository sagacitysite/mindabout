define([
    'backbone',
    'models/pad'
    ], function(
        Backbone,
        Model
    ) {
    var Collection = Backbone.Collection.extend({
        url: '/json/pads',
        model: Model
    });
    
    return Collection;
});