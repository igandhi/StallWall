var mongoose = require('mongoose');

var chatSchema = new mongoose.Schema({
	message: String,
	timestamp: {type: Date, default: Date.now},
	loc: {
		type: {
			type: "String",
			required: true,
			default: 'Point'
		},
		coordinates: [Number]
	}
});

chatSchema.index({'loc': '2dsphere'});

var Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;