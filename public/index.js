$(function() {

	// Initialize variables
	var $window = $(window);
	var $usernameInput = $('.usernameInput');
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');

	var $loginPage = $('.loging.page');
	var $chatPage = $('.chat.page');

	var username;
	var connected = false;
	var typing = false;
	var $currentInput = $usernameInput.focus();
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
		}
		// send location to server
		socket.emit('new location', location);
	}

	// functions
	function setUsername() {
		username = cleanInput($usernameInput.val().trim());

		// If username is valid
		if (username) {
			$loginPage.fadeOut();
			$chatPage.show();
			$loginPage.off('click');
			$currentInput = $inputMessage.focus();

			// Tell server to add new user
			socket.emit('add user', username);
		}
	}

	function sendMessage() {
		var message = $inputMessage.val();
		message = cleanInput(message);
		if (message && connected) {
			$inputMessage.val('');
			addChatMessage({
				username: username,
				message: message
			});
			// send new message to server
			socket.emit('new message', message);
		}
	}

	function addChatMessage(data) {
		var $usernameDiv = $('<span class="username"/>').text(data.username);
		var $messageBodyDiv = $('<span class="messageBody"/>').text(data.message);

		var $messageDiv = $('<li class="message"/>')
			.data('username', data.username)
			.append($usernameDiv, $messageBodyDiv);

		addMessageElement($messageDiv)
	}

	function addMessageElement(el) {
		var $el = $(el);
		$messages.append($el);
		$messages[0].scrollTop = $messages[0].scrollHeight;
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
			if (username) {
				sendMessage();
				socket.emit('stop typing');
				typing = false;
			} else {
				setUsername();
			}
		}
	});

	$loginPage.click(function() {
		$currentInput.focus();
	});

	$inputMessage.click(function() {
		$inputMessage.focus();
	});

	// socket events
	socket.on('login', function(data) {
		connected = true;
	});

	socket.on('new message', function(data) {
		addChatMessage(data);
	});


});