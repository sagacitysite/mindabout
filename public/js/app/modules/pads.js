define([
    'Marionette',
    'controllers/pads'
], function(
    Marionette,
    Controller
    ) {
    var controller = new Controller();
    
    var Module = function(module, App) {
        App.router.route('pads', 'pads_index', controller.route_pads_index.bind(controller));
    };
    
    return Module;
    });