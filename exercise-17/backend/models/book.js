const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const schema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		unique: true,
		minlength: 5,
	},
	published: {
		type: Number,
		required: true,
		min: 0,
	},
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Author",
		required: true,
	},
	genres: [{ type: String }],
});

schema.plugin(uniqueValidator);

module.exports = mongoose.model("Book", schema);
