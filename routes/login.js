var path = require('path');
var ejs = require('ejs');

//handler für die Homepage
exports.home = function(req, res){
     // if user is not logged in, ask them to login
    if (typeof req.session.username == 'undefined') {
        //home.jade view wird geladen
        res.render('login', {title: 'login'});
        // if user is logged in already, take them straight to the items list
    } else {
        res.redirect('/padlist');
    }
};

// handler for form submitted from homepage
exports.home_post_handler = function(req, res) {
    //id des Texfeldes ist username im container body
    // if the username is not submitted, give it a default of "Anonymous"
    var username = req.body.username || 'Anonymous';
    // store the username as a session variable
    req.session.username = username;
    // redirect the user to homepage
    res.redirect('/');
};

// Datenbank: muss ausgetauscht werden
var pads = ['url1', 'url2'];
/*var items = {
    PAD1:{url:'www.google.de'},
    PAD2:{url:'URL2'},
};*/


// handler for displaying the Ehterpads
exports.etherpads = function(req, res) {
    // don't let nameless people view the items, redirect them back to the homepage
    if (typeof req.session.username == 'undefined') {
        res.redirect('/');
        console.log("User nicht eingeloggt");
    } else {
        res.render('etherpads', { title: 'Liste', username: req.session.username, pads:pads });
    }
};

exports.etherpads_post_handler = function(req, res) {
    //var filepath = path.resolve(__dirname, "..");
    //var callback = new ejs({url: filepath + '/views/etherpads.ejs'}).update('pads');
    pads.push(req.body.padname);
    
    res.redirect('/');
    
    //res.renderPjax('etherpads', { pads: pads });
};