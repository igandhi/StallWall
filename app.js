var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var consolidate = require('consolidate');
var morgan = require('morgan');
var Chat = require('./models/chat.js');

app.set('port', process.env.PORT || 3000);

// Set swig as the template engine
app.engine('html', consolidate['swig']);

// Set views path and view engine
app.set('view engine', 'html');
app.set('views', './public');

// Environment dependent middleware
if (process.env.NODE_ENV === 'production') {
	app.locals.cache = 'memory';
}else {
	// Enable logger (morgan)
	app.use(morgan('dev'));
	// Disable views cache
	app.set('view cache', false);
}

// Root routing
app.route('/').get(function (req, res) {
	res.render('index', {title: 'Stall Wall'});
}).post(function (req, res) {
	// Handle POST requests, if any
	res.end();
});

app.route('/home').get(function (req, res) {
	res.render('home', {title: 'Stall Wall'});
}).post(function (req, res) {
	// Handle POST requests, if any
	res.end();
});

app.route('/feed').get(function (req, res) {
	res.render('feed', {title: 'Stall Wall'});
}).post(function (req, res) {
	// Handle POST requests, if any
	res.end();
});

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
		Chat.find ({
			"loc": {
				$near: { 
					$geometry: {
						type: "Point", 
						coordinates: [data.longitude, data.latitude]
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