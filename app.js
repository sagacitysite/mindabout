// url: http://alexehrnschwender.com/2013/07/client-side-auth-session-mgmt-backbone-node/
/**
 * Module dependencies.
 */
 
// cookie config
var config = {
    port: 3000,
    sessionSecret: 'bb-login-secret',
    cookieSecret: 'bb-login-secret',
    cookieMaxAge: (1000 * 60 * 60 * 24 * 36)
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

// ########################
// ###   H E L P E R S  ###
// ########################

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

function count_participants(response,tid_) {
    db.collection('topic_participants').count( {tid:tid_}, function(err, count) {
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
    
    var tid_ = topic._id.toString();
    // extend number of votes for this topic
    db.collection('topic_votes').count( {tid:tid_}, function(err, count) {
        _.extend(topic,{votes:count});
        
        // check if user has voted for topic
        db.collection('topic_votes').count(
            {tid:tid_, uid:uid_},
            function(err, count) {
                _.extend(topic,{voted:count});
                
                // extend number of members for this topic
                db.collection('topic_participants').count( {tid:tid_}, function(err, count) {
                    _.extend(topic,{participants:count});
                    
                    // check if user has joined topic
                    db.collection('topic_participants').count(
                        {tid:tid_, uid:uid_},
                        function(err, count) {
                            _.extend(topic,{joined:count});
                            
                            // send response
                            finished(topic);
                        });
                    });
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
    // db.collection('topics').count( { name: topic.name } )) {
    //     res.json({error:'Topic already exists!'});
    //     return;
    // }

    var ObjectId = require('mongodb').ObjectID;
    db.collection('topics').update(
        { _id: ObjectId(topic._id) }, { $set: {name: topic.name, desc: topic.desc } }, 
        {}, function (err, inserted) {});
    res.json(topic);
    
});});

function createGroups(topic) {
    var ObjectId = require('mongodb').ObjectID;
        
    var groupSize = 4.5; // group size is 4 or 5
    var limitSimpleRule = 50; // number of topic_participants (if more then x topic_participants, complex rule is used)
    
    // calculated values
    var groupMinSize = (groupSize-0.5);
    var groupMaxSize = (groupSize+0.5);
    
    // find topic_participants
    db.collection('topic_participants').find( { tid:topic._id }).toArray( function(err, topic_participants) {
        var numTopicParticipants = topic_participants.length;
        
        console.log('numTopicParticipants: '+numTopicParticipants);
        
        // compute number of groups
        var numGroups;
        if(numTopicParticipants>limitSimpleRule)
            numGroups = numTopicParticipants/groupSize; // simple rule, ideally all groups are 5, group size 4 only exception
        else
            numGroups = numTopicParticipants/groupMaxSize; // complex rule, 4 and 5 uniformly distributed
        numGroups = Math.ceil(numGroups); // round up to next integer
        
        console.log('rounded groups: '+numGroups);
        
        // shuffle topic_participants
        _.shuffle(topic_participants);
        
        console.log('participants shuffled');
        
        // initialize empty groups
        var groups = new Array(numGroups);
        for(var i=0; i<numGroups; ++i)
            groups[i] = [];
            
        // push topic_participants into groups
        _.each(topic_participants, function(participant) {
            
            // find first smallest group
            var group = _.min(groups, function(group) {return group.length;});
            group.push(participant.uid);
        });

        // log group participant distribution
        var counts = _.countBy(groups, function(group) {return group.length;});
        console.log('groups filled: ' + JSON.stringify(counts));
        
        // insert all groups into database
        _.each(groups, function(group) {
            // create group new id
            var gid = ObjectId();
            
            // create group itself
            db.collection('groups').insert({'gid':gid,'tid':topic.tid}, function(err) {});
            
            // create participants for this group
            /*_.each(group, function(uid) {
                db.collection('group_participants').insert(
                    {'gid':gid,'uid':uid},
                    function(err, group_participant){
                        console.log('new group_participant');
                    });
            });*/
        });
    });
}

function getDeadline(givenStage) {
    var oneWeek = 1000*60*60*24*7; // one week milliseconds
    var deadline = Date.now();
    
    switch (givenStage) {
        case 0: // get selection stage deadline
            deadline += oneWeek;
            break;
        case 1: // get proposal stage deadline
            deadline += oneWeek;
            break;
        case 2: // get consensus stage deadline
            deadline = 0; // no deadline in consensus stage
            break;
    }
    
    return deadline;
}

function manageTopicState(topic) {
    // exit this funtion if stage transition is not due yet
    if(Date.now()<topic.nextStageDeadline)
        return;
    
    // move to next stage
    switch (topic.stage) {
        case 0: // we are currently in selection stage
            ++topic.stage;
            topic.nextStageDeadline = getDeadline(1); // get deadline for proposal stage
            break;
        case 1: // we are currently in proposal stage
            ++topic.stage;
            //topic.nextStageDeadline = ..; // TODO see below
            createGroups(topic);
            break;
        case 2: // we are currently in consensus stage
            //++topic.stage; // TODO consensus stage should be handled with separate logic
            // e.g. when groups are finished
            break;
    }
    
    // update database
    db.collection('topics').update(
        { _id: topic._id },
        { $set: {stage: topic.stage, nextStageDeadline: topic.nextStageDeadline } },
        {}, function (err, inserted) {});
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
    topic.timeCreated = Date.now();
    topic.nextStageDeadline = getDeadline(0);
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
    
    // get user id and put into vote
    topic_vote['uid'] = req.signedCookies.uid;

    // TODO use findAndModify as in proposal
    db.collection('topic_votes').count( topic_vote, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_votes').insert(topic_vote, function(err, topic_vote) {
                // return number of current votes
                count_votes(res,topic_vote[0].tid);
            });
            console.log('user ' + topic_vote.uid + ' voted for topic ' + topic_vote.tid );
        } else
            // return number of current votes
            count_votes(res,topic_vote.tid);
    });
    
});});

app.post('/json/topic-unvote', function(req, res) { auth(req, res, function(req, res) {
    var topic_vote = req.body;
    
    // get user id and put into vote
    topic_vote['uid'] = req.signedCookies.uid;
    // remove entry
    db.collection('topic_votes').remove(topic_vote,true,
        function(vote,err) {
            // return number of current votes
            count_votes(res,topic_vote.tid);
        });
});});

app.post('/json/topic-join', function(req, res) { auth(req, res, function(req, res) {
    var topic_participant = req.body;
    
    // get user id and put into vote
    topic_participant['uid'] = req.signedCookies.uid;

    // TODO use findAndModify as in proposal
    db.collection('topic_participants').count( topic_participant, function(err, count) {
        // do not allow user to vote twice for the same topic
        if(0 == count) {
            db.collection('topic_participants').insert(topic_participant, function(err, topic_participant) {
                // return number of current votes
                count_participants(res,topic_participant[0].tid);
            });
            console.log('user ' + topic_participant.uid + ' joined topic ' + topic_participant.tid );
        } else
            // return number of current topic_participants
            count_participants(res,topic_participant.tid);
    });
    
});});

app.post('/json/topic-unjoin', function(req, res) { auth(req, res, function(req, res) {
    var topic_participant = req.body;
    
    // get user name and put into vote
    topic_participant['uid'] = req.signedCookies.uid;
    // remove entry
    db.collection('topic_participants').remove(topic_participant,true,
        function(member,err) {
            // return number of current topic_participants
            count_participants(res,topic_participant.tid);
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

// ###################
// ###   T E S T   ###
// ###################

app.get('/test/fill_topic_participants', function(req, res) {
    var ObjectId = require('mongodb').ObjectID;
    
    for(i = 0; i < 1000; ++i) {
        db.collection('topic_participants').insert(
            {'tid':'54f646ccc3a414a60d40d660','uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    for(i = 0; i < 40; ++i) {
        db.collection('topic_participants').insert(
            {'tid':'54ff453cfec7e11108ca2f65','uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    
    res.send('successfull');
});

app.get('/test/create_groups', function(req, res) {
    var ObjectId = require('mongodb').ObjectID;

    /*db.collection('groups').remove({tid:'54ff453cfec7e11108ca2f65'},true,
        function(topic_participant,err) {
        });
    createGroups({_id:'54ff453cfec7e11108ca2f65'});*/
    
    db.collection('groups').remove({tid:'54ff453cfec7e11108ca2f65'},true,
        function(topic_participant,err) {
        });
    createGroups({_id:'54ff453cfec7e11108ca2f65'});

    res.send('successfull');
});

// ###################
// ### S E R V E R ###
// ###################

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

