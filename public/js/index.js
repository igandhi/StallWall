$(function() {

	// Initialize variables
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');
	var $submit = $('#inputMessageButton');

	var firstTime = true;
	var connected = false;
	var latitude;
	var longitude;

	var socket = io();

	// get user's location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition);
	} else {
		console.log('Geolocation not supported by browser');
	}

	function showPosition(position) {
		latitude = position.coords.latitude;
		longitude = position.coords.longitude;
		$('.position').text('Position: ' + latitude + ', ' + longitude);
		var location = {
			lat: latitude,
			lon: longitude
		};
		// send location to server
		socket.emit('new location', location);
	}

	function sendMessage() {
		var message = $inputMessage.val();
		message = cleanInput(message);
		if (message && connected) {
			$inputMessage.val('');

			var bundle = {
				message: message,
				timestamp: new Date(),
				latitude: latitude,
				longitude: longitude
			};

			addChatMessage([bundle]);

			// send new message to server
			socket.emit('new message', bundle);
		}
	}

	function addChatMessage(data) {
		for (var i=0; i<data.length; i++){
			var prettyTime = moment(data[i].timestamp).fromNow();
			var $timestampDiv = $('<p class="message-timestamp"/>').text(prettyTime);
			var $messageBodyDiv = $('<h4 class="message-body"/>').text(data[i].message);
			var $messageDiv = $('<div class="row message"/>').append($messageBodyDiv, $timestampDiv);
			$messageDiv.append('<hr/>');
			$messages.prepend($messageDiv);
		}
	}

	function cleanInput(input) {
		return $('<div/>').text(input).text();
	}

	// keyboard events
	$inputMessage.keydown(function (event) {
		// When enter is pressed
		if (event.which === 13) {
			sendMessage();
		}
	});
	
	$submit.click(function(event) {
		sendMessage();
	});

	// socket events
	socket.on('nearby messages', function(data) {
		if (firstTime) {
			addChatMessage(data.data);
			firstTime = false;
		}
		connected = true;
	});

	socket.on('new message', function(data) {
		addChatMessage([data]);
	});
});