var express = require('express');
var app = express();
var fs = require('fs')
var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient
var moment = require('moment');
moment().format();
var windSpeeds,times;
var mongoURL = 'mongodb://localhost:27017/wind';

app.get('/data',function(req,res){
		var container = {};
		container.speeds = windSpeeds;
		container.times = times;
		console.log(container);
		res.json(container);
		// res.send(JSON.stringify(container));
		})

var server = app.listen(3000,function(){
		var host = server.address().address;
		var port = server.address().port;
		console.log("Listening at http://%s:%s",host,port);
		})

function getWind(){
	fs.readFile('data/data.txt','utf-8',function(err,data){
			windSpeeds = [];
			times = [];
			var vals = data.match(/\n\d\d\/\d\d\/\d\d(.)*/g)
			MongoClient.connect(mongoURL,function(err,db){

				vals.forEach(function(el,i){
					var s = el.replace(/ +/g,' ').replace('\n','');
					var d = s.split(' ');
					if(d[0]){
						var t = moment(d[0] + d[1], 'DD-MM-YYh:mma')
						windSpeeds.push(d[7]);
						times.push(t);
						upsertRecord({_id:t.toString()},{$set:{speed:d[7]}},db,function(){
							if(i === vals.length) {
								console.log('closing');
								db.close();
							}
						});
					}
					//if(i == vals.length - 1){
					//	console.log('closing mongo');
					//	db.close();
						}
					)
				}
				)
})}

new CronJob('*/5 * * * * *', function() {
		console.log('You will see this message every second');
		getWind();
		}, null, true, 'America/Vancouver');


var upsertRecord = function(id,rec,db,callback){
	var collection = db.collection('jericho');
	collection.update(
			id,
			rec,
			function(err,res){
				if(err)
					throw err
				callback(res);
			}
			)
}
