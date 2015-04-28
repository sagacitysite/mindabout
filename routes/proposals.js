var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

exports.query = function(req, res) {
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    db.collection('proposals').findAndModify({
            query: { 'tid':ObjectId(req.params._id), 'uid':ObjectId(req.signedCookies.uid) },
            update: {
              $setOnInsert: { url: process.env.IP+"/test" }
            },
            new: true,
            upsert: true
        },
        function(err, proposal) {
            res.location(proposal.url);
        });
};