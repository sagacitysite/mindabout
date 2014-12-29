define([
    'Marionette',
    'controllers/login',
    'controllers/register',
    'controllers/pads',
    'controllers/topics',
    'controllers/topic'
], function(
    Marionette,
    Login,
    Register,
    Pads,
    Topics,
    Topic
    ) {
    var login = new Login();
    var register = new Register();
    var pads = new Pads();
    var topics = new Topics();
    var topic = new Topic();

    var Module = function(module, App) {
        App.router.route('', 'login_index', login.route_login_index.bind(login)); // TODO use auth handler here
        App.router.route('pads', 'pads_index', pads.route_pads_index.bind(pads));
        App.router.route('topics', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topic/:id', 'topic_index', topic.route_topic_index.bind(topic));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
    };
    
    return Module;
    });