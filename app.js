// url: http://alexehrnschwender.com/2013/07/client-side-auth-session-mgmt-backbone-node/
/**
 * Module dependencies.
 */
var _ = require('underscore');
var bcrypt = require('bcrypt');
var express = require('express');
var http = require('http');
var path = require('path');
//var mongodb = require('mongodb');
var mongoskin = require('mongoskin');
var db = mongoskin.db(process.env.IP, { database: 'mindabout' });
var app = express();

// all environments
app.set('port', process.env.PORT || process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('secret'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));

/*// TODO use http://passportjs.org/guide/basic-digest/ ?
passport.use(new DigestStrategy({ qop: 'auth' },
  function(username, done) {
    db.collection('users').find({ uid: uid }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user, user.upw);
    });
  },
  function(params, done) {
    // validate nonces as necessary
    done(null, true)
  }
));*/

// cookie config
var config = {
    port: 3000,
    sessionSecret: 'bb-login-secret',
    cookieSecret: 'bb-login-secret',
    cookieMaxAge: (1000 * 60 * 60 * 24 * 365)
}
// FIXME below
//app.use( express.cookieParser( config.cookieSecret ) );           // populates req.signedCookies
//app.use( express.cookieSession( config.sessionSecret ) );         // populates req.session, needed for CSRF

function clean_user_data(user) {
    return _.omit(user, ['upw', 'auth_token']);
}

// auth to encapsulate, e.g. app.get('/json/pads', auth(req,res,function(req, res) ...
function auth(req, res, next) {
    db.collection('users').findOne({ uid: req.signedCookies.uid, auth_token: req.signedCookies.auth_token }, function(err, user){
        if(user){
            console.log('User authentication valid ' + JSON.stringify(user));
            //res.json({ user: _.omit(user, ['upw', 'auth_token']) });
            
            // handle request
            next(req, res);
        } else {
            console.log('User authentication invalid');
            res.json({ error: "Client has no valid login cookies." });
        }
    });
}

// topics
app.get('/json/topics', function(req, res) { auth(req, res, function(req, res) {
    db.collection('topics').find().toArray(function(err, topics) {
        
        _.each(topics,function(topic) {
            _.extend(topic,{votes: 5});
        });

        res.json(topics); // TODO get votes from table
        console.log('get topics');
    });
    
});});

app.put('/json/topic/:id', function(req, res) { auth(req, res, function(req, res) {
    var topic = req.body;
    
    // TODO crashes server
    // // only allow new topics if they do not exist yet
    // if(db.collection('topics').count( { name: topic.name } ) > 0) {
    //     res.json({error:'Topic already exists!'});
    //     return;
    // }

    var ObjectId = require('mongodb').ObjectID;
    db.collection('topics').update(
        { _id: ObjectId(topic._id) }, { $set: {name: topic.name, desc: topic.desc } }, {}); // FIXME
    res.json(topic);
    
});});

app.post('/json/topic', function(req, res) { auth(req, res, function(req, res) {
    var topic = req.body;
    
    topic.status = 0;
    topic.level = 0;
    db.collection('topics').insert(topic, function(err, topic){
        res.json(topic[0]);
        console.log('new topic');
    });

});});

app.delete('/json/topic/:id', function(req, res) { auth(req, res, function(req,res) {
    db.collection('topics').removeById(req.params.id, function() {
        res.json({deleted: true});
    });
});});

app.post('/json/topic-vote', function(req, res) { auth(req, res, function(req, res) {
    var topic_vote = req.body;
    
    // get user name and put into vote
    topic_vote['uid'] = req.signedCookies.uid;
    
    db.collection('topic_votes').count( topic_vote, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_votes').insert(topic_vote, function(err, topic_vote_){
            });
            console.log('user ' + topic_vote.uid + ' voted for topic ' + topic_vote.tid );
        }
        
        // return number of current votes
        db.collection('topic_votes').count( {tid:topic_vote.tid}, function(err, count) {
            res.json(count);
        });
    });
    
});});

// pads
app.get('/json/pads', function(req, res) { auth(req, res, function(req, res) {
    db.collection('pads').find().toArray(function(err, pads) {
        res.json(pads);
        console.log('Getting pads');
    });
});});

app.post('/json/pad', function(req, res) { auth(req, res, function(req, res) {
    var pad = req.body;
    db.collection('pads').insert(pad, function(err, pad){
        res.json(pad[0]);
    });
});});

app.delete('/json/pad/:id', function(req, res) { auth(req, res, function(req,res) {
    db.collection('pads').removeById(req.params.id, function() {
        res.json({deleted: true});
    });
});});

// authentification
// TODO required?
app.get("/json/auth", function(req, res){
    db.collection('users').findOne({ uid: req.signedCookies.uid, auth_token: req.signedCookies.auth_token }, function(err, user){
        if(user){
            res.json({ user: clean_user_data(user) });
        } else {
            res.json({ error: "Client has no valid login cookies."  });   
        }
    });
});

// POST /api/auth/login
// @desc: logs in a user
app.post("/json/auth/login", function(req, res){
    db.collection('users').findOne({ uid: req.body.uid }, function(err, user){
        if(user){
            // Compare the POSTed password with the encrypted db password
            if( bcrypt.compareSync( req.body.upw, user.upw) ){
                res.cookie('uid', user.uid, { signed: true, maxAge: config.cookieMaxAge  });
                res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge  });

                // Correct credentials, return the user object
                res.json({ user: clean_user_data(user) });
                
                console.log('User login valid ' + JSON.stringify(user));

            } else {
                // Username did not match password given
                res.json({ error: "Invalid username or password."  });   
                
                console.log('Userpassword invalid ' + JSON.stringify(user));
            }
        } else {
            // Could not find the username
            res.json({ error: "Username does not exist."  });   
            
            console.log('Username invalid ' + JSON.stringify(req.body.uid));
        }
    });
});

// creates a user
app.post("/json/auth/signup", function(req, res){
    var user = req.body;
    
    user.upw = bcrypt.hashSync(user.upw, 8);
    user.auth_token = bcrypt.genSaltSync(8);
    
    // url: https://www.npmjs.org/package/bcrypt-nodejs
    db.collection('users').insert(user, function(err, user){
        user = user[0];
        
        if(err){
            res.json({ error: "Error while trying to register user " + JSON.stringify(user) });
            console.log(err);
        } else {
            console.log('Saved user ' + JSON.stringify(user));
            res.cookie('uid', user.uid, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge  });
            res.json( {user : clean_user_data(user)} );
            // TODO Login/Signup trennen
        }
    });
});

// POST /api/auth/logout
// @desc: logs out a user, clearing the signed cookies
app.post("/api/auth/logout", function(req, res){
    res.clearCookie('uid');
    res.clearCookie('auth_token');
    res.json({ success: "User successfully logged out." });
    
    console.log('User successfully logged out');
});

/*// POST /api/auth/remove_account
// @desc: deletes a user
app.post("/api/auth/remove_account", function(req, res){
    db.run("DELETE FROM users WHERE id = ? AND auth_token = ?", [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, rows){
        if(err){ 
            res.json({ error: "Error while trying to delete user." }); 
        } else {
            res.clearCookie('user_id');
            res.clearCookie('auth_token');
            res.json({ success: "User successfully deleted." });
        }
    });
});*/

// server listening
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
