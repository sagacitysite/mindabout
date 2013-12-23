define([
    'Backbone'
    ], function(
    Backbone
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/pad'
    });
    
    return Model;
});