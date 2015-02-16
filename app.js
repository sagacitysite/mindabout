// url: http://alexehrnschwender.com/2013/07/client-side-auth-session-mgmt-backbone-node/
/**
 * Module dependencies.
 */
 
// cookie config
var config = {
    port: 3000,
    sessionSecret: 'bb-login-secret',
    cookieSecret: 'bb-login-secret',
    cookieMaxAge: (1000 * 60 * 60 * 24 * 365)
}

var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var http = require('http');
var cookieParser = require('cookie-parser');
//var cookieSession = require('cookie-session');

var _ = require('underscore');
var bcrypt = require('bcrypt');
var path = require('path');
//var mongodb = require('mongodb');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var app = express();

// all environments
app.set('port', process.env.PORT || process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon('public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser('secret'));
//app.use(cookieSession('secret'));
app.use(session({ secret: 'secret', key: 'uid', cookie: { secure: true }}));
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

function clean_user_data(user) {
    return _.omit(user, ['upw', 'auth_token']);
}

function count_votes(response,tid_) {
    db.collection('topic_votes').count( {tid:tid_}, function(err, count) {
        response.send(count.toString());
    });
}

// auth to encapsulate, e.g. app.get('/json/pads', auth(req,res,function(req, res) ...
function auth(req, res, next) {
    //console.log(req.signedCookies.uid);
    
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

// ###################
// ### T O P I C S ###
// ###################

function extendTopicInfo(topic,uid_,finished) {
    
    // extend stage name
    switch (topic.stage) {
        case 0:
            topic.stageName = "selection";
            break;
        case 1:
            topic.stageName = "proposal";
            break;
        case 2:
            topic.stageName = "consensus";
            break;
    }
    
    // extend number of votes for this topic
    var tid_ = topic._id.toString();
    db.collection('topic_votes').count( {tid:tid_}, function(err, count) {
        _.extend(topic,{votes:count});
        
        // check if user has voted for topic
        db.collection('topic_votes').count(
            {tid:tid_, uid:uid_},
            function(err, count) {
                _.extend(topic,{voted:count});
                finished(topic);
            });
    });
}

app.get('/json/topics', function(req, res) { auth(req, res, function(req, res) {
    db.collection('topics').find().toArray(function(err, topics) {
       
        console.log('get topics');

        // send response only if all queries have completed
        var finished = _.after(topics.length, function(topic) {
            res.json(topics);
        });

        // loop over all topics        
        _.each(topics,function(topic) {
            extendTopicInfo(topic,req.signedCookies.uid,finished);
        });
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

function createGroups(topic) {
    var groupSize = 5;
    
    // count proposals
    db.collection('proposals').count( { tid:topic.tid }, function(err, numProposals) {
        // compute number of groups
        var numGroups = numProposals/groupSize;
        
        for(var i=0; i<numGroups; ++i)
            ;
            
        // create groups
        db.collection('proposals').find( { tid:topic.tid }, function(err, proposal) {
            // select group randomly
            var gid = 0;
            
            db.collection('proposals').count( { gid:topic.tid }, function(err, numProposals) {
            });
        });
    });
}

function manageTopicState(topic) {
    // Date(year, month, day, hour, minute, second, millisecond);
    var oneWeek = new Date(0,0,7,0,0,0,0);
    var selectionSpan = oneWeek;
    var proposalSpan = oneWeek;
    var consensusSpan = oneWeek;
    //var completedSpan = oneWeek;
    
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextStageDeadline)
        return;
    
    // move to next stage
    switch (topic.stage) {
        case 0: // we are currently in selection stage
            topic.nextStageDeadline += proposalSpan;
            ++topic.stage;
            break;
        case 1: // we are currently in proposal stage
            topic.nextStageDeadline += consensusSpan;
            ++topic.stage;
            createGroups(topic);
            break;
        case 2: // we are currently in consensus stage
            ++topic.stage;
            break;
    }
    
    // update database
    var ObjectId = require('mongodb').ObjectID;
    db.collection('topics').update(
        { _id: ObjectId(topic._id) },
        { $set: {stage: topic.stage, nextStageDeadline: topic.nextStageDeadline } }, {}); // FIXME
}

app.get('/json/topic/:id', function(req, res) { auth(req, res, function(req, res) {
    var ObjectId = require('mongodb').ObjectID;
    db.collection('topics').findOne({ _id:ObjectId(req.params.id) }, function(err, topic) {
        extendTopicInfo(topic,req.signedCookies.uid,function(topic) {res.json(topic);});
        manageTopicState(topic);
    });
});});

app.post('/json/topic', function(req, res) { auth(req, res, function(req, res) {
    var topic = req.body;

    topic.stage = 0;
    topic.level = 0;
    topic.timeCreated = new Date();
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
    
    // TODO use findAndModify as in proposal
    db.collection('topic_votes').count( topic_vote, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_votes').insert(topic_vote, function(err, topic_vote) {
                // return number of current votes
                count_votes(res,topic_vote.tid);
            });
            console.log('user ' + topic_vote.uid + ' voted for topic ' + topic_vote.tid );
        } else
            // return number of current votes
            count_votes(res,topic_vote.tid);
    });
    
});});

app.post('/json/topic-unvote', function(req, res) { auth(req, res, function(req, res) {
    var topic_vote = req.body;
    
    // get user name and put into vote
    topic_vote['uid'] = req.signedCookies.uid;
    // remove entry
    db.collection('topic_votes').remove(topic_vote,true,
        function(vote,err) {
            // return number of current votes
            count_votes(res,topic_vote.tid);
        });
});});

// #########################
// ### P R O P O S A L S ###
// #########################
app.get('/json/proposal/:id', function(req, res) { auth(req, res, function(req, res) {
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    var ObjectId = require('mongodb').ObjectID;
    db.collection('proposals').findAndModify({
            query: { tid:ObjectId(req.params.id), uid:req.signedCookies.uid },
            update: {
              $setOnInsert: { url: process.env.IP+"/test" }
            },
            new: true,
            upsert: true
        },
        function(err, proposal) {
            res.location(proposal.url);
        });
});});

// ###################
// ### G R O U P S ###
// ###################

app.get('/json/groups', function(req, res) { auth(req, res, function(req, res) {
    db.collection('groups').find().toArray(function(err, groups) {
        console.log('get groups');
        res.json(groups);
    });
});});

// get group by id
app.get('/json/group/:id', function(req, res) { auth(req, res, function(req, res) {
    var ObjectId = require('mongodb').ObjectID;
    db.collection('groups').findOne({ _id:ObjectId(req.params.id) }, function(err, group) {
        res.json(group);
    });
});});

// ###################
// ###   A U T H   ###
// ###################

// authentification
// TODO required?
app.get("/json/auth", function(req, res){
    db.collection('users').findOne({ uid: req.signedCookies.uid, auth_token: req.signedCookies.auth_token }, function(err, user){
        if(user){
            res.json({ user: clean_user_data(user) });
        } else {
            //res.json({ error: "Client has no valid login cookies."  });
            res.redirect("/#/");
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
                //res.json({ error: "Invalid username or password."  });   
                res.redirect("/#/");

                console.log('Userpassword invalid ' + JSON.stringify(user));
            }
        } else {
            // Could not find the username
            //res.json({ error: "Username does not exist."  });   
            res.redirect("/#/");

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

        // get first element
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
