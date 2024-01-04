const mongoose = require('mongoose');
const { isAlphanumeric } = require('lib/regex');
const Schema = mongoose.Schema;

const SpaceSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    examples: [
        String
    ],
    aliases: [
        String
    ],
    tags: [
        {
            type: String,
            match: /^[a-zA-Z0-9_-]+$/,
        }
    ],
});

// Create the Index
SpaceSchema.index({
	name: 'default_spaces',
	definition: {
		mappings: {
			dynamic: true
		}
	}
});

module.exports = mongoose.model('spaces', SpaceSchema);