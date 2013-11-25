var path = require('path');

//handler für die Homepage
exports.home = function(req, res){
     // if user is not logged in, ask them to login
    if (typeof req.session.username == 'undefined') {
        //home.jade view wird geladen
         
        // read html file 'login.ejs' and write it to inc
        var fs = require('fs');
        //Zielordner: eins über __dirname
        var newPath = path.resolve(__dirname, "..");
        fs.readFile( newPath + '/views/login.ejs', function (err, data) {
          if (err) { throw err; }
          //console.log(data.toString());
        });
        
        res.render('home', { title: 'Login', inc: fs })
        
        // if user is logged in already, take them straight to the items list
    } else {
        res.redirect('/padList');
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
var items = {
    PAD1:{url:'www.google.de'},
    PAD2:{url:'URL2'},
};

// handler for displaying the Ehterpads
exports.etherpads = function(req, res) {
    // don't let nameless people view the items, redirect them back to the homepage
    if (typeof req.session.username == 'undefined') {
        res.redirect('/');
        console.log("User nicht eingeloggt");
    } 
    else 
        res.render('etherpads', { title: 'Liste', username: req.session.username, items:items });
};