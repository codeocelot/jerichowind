var request = require('request');
var express = require('express');
var app = express();
var fs = require('fs')
var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient
var moment = require('moment');
moment().format();
var mongoURL = 'mongodb://localhost:27017/wind';

// app.use(function(req,res){
// 	console.log('in use')
// 	res.setHeader("Access-Control-Allow-Origin","*")
// })

app.set('views',__dirname)

app.set('view engine','jade');
app.use('/bower_components',express.static(__dirname + '/bower_components'));

app.get('/*',function(req,res,next){
	res.setHeader("Access-Control-Allow-Origin","*");
	next();
})

app.get('/data',function(req,res){
	console.log('in data')
	MongoClient.connect(mongoURL,function(err,db){
		getRecords(db,function(err,data){
			console.log(data)
			res.json(data);
		})
	})
})

var server = app.listen(3000,function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("Listening at http://%s:%s",host,port);
})

app.get('/chart',function(req,res){
	res.render('views/chart');
});

function getWind(){
	request('http://jsca.bc.ca/main/downld02.txt',function(error,response,data){
		if(!error && response.statusCode === 200){
			// windSpeeds = [];
			//times = [];
			var vals = data.match(/\n\d\d\/\d\d\/\d\d(.)*/g)
			MongoClient.connect(mongoURL,function(err,db){
				vals.forEach(function(el,i){
					var s = el.replace(/ +/g,' ').replace('\n','');
					var d = s.split(' ');
					if(d[0]){
						var t = moment(d[0] + d[1], 'DD-MM-YYh:mma')
						upsertRecord({_id:t.format('X')},{$set:{speed:d[7],maxSpeed:d[10],direction:d[8],maxDirection:d[11],bar:d[15],rain:d[16],rainRate:d[17],temp:d[3]}},db,function(){
							if(i === vals.length) {
								db.close();
							}
						});
					}
				}
				)
			}
			)}
		})};

new CronJob('0 */5 * * * *', function() {
		console.log('cron job fired at: ', new Date().toString())
		getWind();
	}, null, true, 'America/Vancouver');


var upsertRecord = function(id,rec,db,callback){
	var collection = db.collection('jericho');
	collection.update(
		id,
		rec,
		{upsert:true,w:1},
		function(err,res){
			if(err){
				console.log('error encountered: ', err);
				throw err
			}
			callback(res);
		}
		)
};

var getRecords = function(db,callback){
	var collection = db.collection('jericho');
	collection.find({},function(err,recs){
		recs.toArray(callback)
	})
}
