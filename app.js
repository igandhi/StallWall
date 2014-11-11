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
			message: data
		});
	});

	socket.on('add user', function(username) {
		socket.username = username;
		usernames[username] = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});
	})
})

server.listen(3000, function() {
	console.log('listening on port 3000');
});