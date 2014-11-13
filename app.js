var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');

var Chat = require('./models/chat.js');

app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/stallwall', function(err, res) {
	if (err) return console.log('ERROR connecting to db');
	console.log('Successfully connected to db');
});

var usernames = {};
var numUsers = 0;

io.on('connection', function(socket) {
	console.log('new user connected');
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
});

io.on('connection', function(socket) {
	var addedUser = false;

	socket.on('new location', function(loc) {
		console.log(loc.lat);
		console.log(loc.lon);
	});

	socket.on('new message', function(data) {
		console.log('data receive: ' + data.latitude);
		var newMessage = new Chat({
			message: data.message,
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
			timestamp: Date.now,
			message: data.message
		});
	});

	socket.on('new user', function(data) {
		var nearbyMessages;
		Chat.find ({
			"loc": {
				$near: { 
					$geometry: {
						type: "Point", 
						coordinates: [-73.981891 , 40.736936]
					}, 
					$maxDistance: 4
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

server.listen(3000, function() {
	console.log('listening on port 3000');
});