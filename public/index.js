$(function() {

	// Initialize variables
	var $window = $(window);
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');

	var firstTime = true;
	var connected = false;
	var typing = false;
	var $currentInput = $inputMessage.focus();
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
			console.log(data[i]);
			var $timestampDiv = $('<p class="message-timestamp"/>').text(data[i].timestamp);
			var $messageBodyDiv = $('<h4 class="message-body"/>').text(data[i].message);
			var $messageDiv = $('<div class="row message"/>').append($messageBodyDiv, $timestampDiv);
			$messages.append($messageDiv);
		}
	}

	function cleanInput(input) {
		return $('<div/>').text(input).text();
	}

	// keyboard events
	$window.keydown(function (event) {
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			$currentInput.focus();
		}
		// When enter is pressed
		if (event.which === 13) {
			sendMessage();
			socket.emit('stop typing');
			typing = false;
		}
	});

	$inputMessage.click(function() {
		$inputMessage.focus();
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