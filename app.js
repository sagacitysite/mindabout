/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var mongoskin = require('mongoskin');

var db = mongoskin.db(3000, { database: 'mindabout' });

var app = express();

// all environments
app.set('port', 3000 || 300);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/json/pads', function(req, res) {
    db.collection('pads').find().toArray(function(err, pads) {
        res.json(pads);
    });
});

app.post('/json/pad', function(req, res) {
    var pad = req.body;
    db.collection('pads').insert(pad, function(err, pad){
        console.log(err);
        res.json(pad);
    }); 
});

app.delete('/json/pad/:id', function(req,res) {
    db.collection('pads').removeById(req.params.id, function() {
        res.json({deleted: true});
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
