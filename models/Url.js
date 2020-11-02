const mongoose = require('mongoose');

const Url = new mongoose.Schema({
	url: String,
	slug: String,
	created: {
		type: Date,
		default: new Date()
	}
});

module.exports = mongoose.model('Url', Url);
