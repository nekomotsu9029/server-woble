const mongoose = require('mongoose');

const {Schema} = mongoose;

const board = new Schema({
    img: String,
	name: String,
	description: String,
	date: String,
	users: []
	/*
		{
		_id,
		name,
		email,
		img
		}
	*/
});

module.exports = mongoose.model('board', board);