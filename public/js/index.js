$(function() {

	// Initialize variables
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');
	var $submit = $('#inputMessageButton');

	var radius = 1;
	var firstTime = true;
	var connected = false;
	var latitude;
	var longitude;

	var socket = io();

	// get user's location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, disableFeaturesAndAlert);
	} else {
		disableFeaturesAndAlert();
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
			var $messageDiv = $('<div class="message callout panel"/>').append($messageBodyDiv, $timestampDiv);
			$messages.prepend($messageDiv);
		}
	}

	function cleanInput(input) {
		return $('<div/>').text(input).text();
	}

	function distanceFromMessage(lat1, lon1, lat2, lon2) {
		var radlat1 = Math.PI * lat1/180
		var radlat2 = Math.PI * lat2/180
		var radlon1 = Math.PI * lon1/180
		var radlon2 = Math.PI * lon2/180
		var theta = lon1-lon2
		var radtheta = Math.PI * theta/180
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist)
		dist = dist * 180/Math.PI
		dist = dist * 60 * 1.1515 * 1609.34
		return dist
	}                                                                           

	function disableFeaturesAndAlert(){
		var error = 'Geolocation has been disabled for this browser.';
		$inputMessage.prop('disabled', true);
		$submit.prop('disabled', true);
		$('#slider').addClass('disabled');
		$('.alert-box').prepend(error);
		$('.alert-box').removeClass('hide');
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

	// slider events
	$('[data-slider]').on('change.fndtn.slider', function(){
	  var range = $('#slider').attr('data-slider');
	  console.log(range);
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
		var distance = distanceFromMessage(latitude, longitude, data.lat, data.lon);
		if (distance <= 4000) {
			addChatMessage([data]);
		}
	});
});