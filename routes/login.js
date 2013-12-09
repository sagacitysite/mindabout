var path = require('path');
var ejs = require('ejs');
//var fs = require('fs');
//var partials = require('express-partials');

//handler für die Homepage
exports.home = function(req, res){
     // if user is not logged in, ask them to login
    if (typeof req.session.username == 'undefined') {
        //home.jade view wird geladen
        
        //var obj = {title: 'login'};
        //openFile(res, 'login', obj);
        
        res.render('login', { obj: {title: 'login'}});
        
        // if user is logged in already, take them straight to the items list
    } else {
        res.redirect('/padList');
    }
};

openFile = function(res, file, object) {
    //var filepath = path.resolve(__dirname, "..") + '/views/' + file;
    //var ret = ejs.render(file, object);
    /*// read html file 'login.ejs' and write it to inc
    //Zielordner: eins über '__dirname'
    var newPath = path.resolve(__dirname, "..");
    
    fs.readFile( newPath + '/views/'+ file +'.ejs', function (err, data) {
      if (err) { throw err; }
      res.render('index', { obj: object, inc: data });
    });*/
    
    /*var filepath = path.resolve(__dirname, "..");
    //console.log(filepath);
    var str = fs.readFileSync(filepath + '/views/'+ file +'.ejs','utf8');
    var html = new ejs.render(str, object);
    console.log(str);
    console.log(object);
    
    res.render('index', { obj: object, inc: html });*/
}

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
var items = ['url1', 'url2'];
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
        //var obj = {title: 'pad-list', username: req.session.username, items:items};
        //openFile(res, 'etherpads', obj);
        
        res.render('etherpads', { obj: {title: 'Liste', username: req.session.username, items:items }});
    }
};