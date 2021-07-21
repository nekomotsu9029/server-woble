const mongoose = require('mongoose');

const {Schema} = mongoose;

const task = new Schema({
    img: String,
	name: String,
	description: String,
	date: String,
	category: String,
	targetDate: String,
	comments: [],
	/*
		{
		img,
		name,
		comment
		}
	*/
	user: {
		name: String,
    	email: String,
    	img: String
	},
	idboard: String
});

module.exports = mongoose.model('task', task);