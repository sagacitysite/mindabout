var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

exports.list = function(req, res) {
    db.collection('groups').find().toArray(function(err, groups) {
        console.log('get groups');
        res.json(groups);
    });
};

// get group by id
exports.query = function(req, res) {
    db.collection('groups').findOne({ '_id':ObjectId(req.params.id) },
    function(err, group) {
        res.json(group);
    });
};