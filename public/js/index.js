$(function() {

	// Initialize variables
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');
	var $submit = $('#inputMessageButton');

	var connected = false;
	var latitude;
	var longitude;
	var range = 1609;
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
		var location = {
			lat: latitude,
			lon: longitude,
			range: range
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
			var isoTime = moment(data[i].timestamp).format();
			var $timestampDiv = $('<p class="message-timestamp" data-livestamp="'+ isoTime +'"/>');
			var $messageBodyDiv = $('<h4 class="message-body"/>').text(data[i].message);
			var $messageDiv = $('<div class="message callout panel"/>').append($messageBodyDiv, $timestampDiv);
			$messages.prepend($messageDiv);
		}
	}

	function cleanInput(input) {
		return $('<div/>').text(input).text();
	}

	function distanceFromMessage(lat1, lon1, lat2, lon2) {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515 * 1609.34;
		return dist;
	}                                                                           

	function disableFeaturesAndAlert(){
		$inputMessage.prop('disabled', true);
		$submit.prop('disabled', true);
		$('#slider').addClass('disabled');
		$('#myModal').foundation('reveal', 'open');
	}

	$('form').submit(function() {
		sendMessage();
	});

	// slider events
	$('[data-slider]').on('change.fndtn.slider', function(){
	  range = $('#slider').attr('data-slider')*1609.34;
	  var location = {
			lat: latitude,
			lon: longitude,
			range: range
		};
	  socket.emit('new location', location);
	});

	// socket events
	socket.on('nearby messages', function(data) {
		$messages.empty();
		addChatMessage(data.data);
		connected = true;
	});

	socket.on('new message', function(data) {
		var distance = distanceFromMessage(latitude, longitude, data.lat, data.lon);
		if (distance <= range) {
			addChatMessage([data]);
		}
	});

	socket.on('ping', function(data){
		socket.emit('pong', {beat: 1});
	});
});