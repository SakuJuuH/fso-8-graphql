const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const schema = new mongoose.Schema({
	value: {
		type: String,
		required: true,
	},
});

schema.plugin(uniqueValidator);

module.exports = mongoose.model("Token", schema);
