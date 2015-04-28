var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

var topics = require('./topics');

exports.fill_topic_participants = function(req, res) {
    for(i = 0; i < 1000; ++i) {
        db.collection('topic_participants').insert(
            {'tid':ObjectId('54f646ccc3a414a60d40d660'),'uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    for(i = 0; i < 40; ++i) {
        db.collection('topic_participants').insert(
            {'tid':ObjectId('54ff453cfec7e11108ca2f65'),'uid':ObjectId()},
            function(err, topic_participants){
                console.log('new topic_participants');
            });
    }
    
    res.send('successfull');
};

exports.create_groups = function(req, res) {
    /*db.collection('groups').remove({tid:'54ff453cfec7e11108ca2f65'},true,
        function(topic_participant,err) {
        });
    createGroups({_id:'54ff453cfec7e11108ca2f65'});*/
    
    db.collection('groups').remove({'tid':ObjectId('54ff453cfec7e11108ca2f65')},true,
        function(topic_participant,err) {
        });
    var topic = {'_id':ObjectId('54ff453cfec7e11108ca2f65')};
    topics.createGroups(topic);

    res.send('successfull');
};