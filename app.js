var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var Chat = require('./models/chat.js');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/stallwall', function(err, res) {
	if (err) return console.log('ERROR connecting to db');
	console.log('Successfully connected to db');
});

io.on('connection', function(socket) {
	console.log('new user connected');
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
});

io.on('connection', function(socket) {

	socket.on('new message', function(data) {
		console.log('data receive: ' + data.latitude);
		var newMessage = new Chat({
			message: data.message,
			timestamp: data.timestamp,
			loc: {
				type: 'Point',
				coordinates: [data.longitude, data.latitude]
			}
		});		
			
		newMessage.save(function (err, newMessage) {
			if (err) return console.error(err);
			console.log('new message saved in db');
		});	

		socket.broadcast.emit('new message', {
			username: socket.username,
			timestamp: data.timestamp,
			message: data.message
		});
	});

	socket.on('new location', function(loc) {
		Chat.find ({
			"loc": {
				$near: { 
					$geometry: {
						type: "Point", 
						coordinates: [loc.lon, loc.lat]
					}, 
					$maxDistance: 4000
				}
			}
		}, function(err, result) {
			if (err) return console.log('Error retreiving data');
			io.emit('nearby messages', {
				data: result
			});
		});
		
	});
});

server.listen(app.get('port'), function() {
	console.log('listening on port '+app.get('port'));
});