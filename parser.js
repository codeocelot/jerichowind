var Transform = require('stream').Transform
, csv = require('csv-streamify')
, JSONStream = require('JSONStream');

var csvToJson = csv({objectMode: true});

var parser = new Transform({objectMode: true});
parser._transform = function(data, encoding, done) {
	this.push(data);
	done();
};

var jsonToStrings = JSONStream.stringify(false);

	process.stdin
	.pipe(csvToJson)
	.pipe(parser)
.pipe(jsonToStrings)
	.pipe(process.stdout);
