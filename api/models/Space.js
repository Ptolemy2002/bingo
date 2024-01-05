const mongoose = require('mongoose');
const { isAlphanumeric } = require('lib/regex');
const Schema = mongoose.Schema;

const SpaceSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        default: null
    },
    examples: [
        {
            type: String,
            trim: true,
            minlength: 1
        }
    ],
    aliases: [
        {
            type: String,
            trim: true,
            minlength: 1
        }
    ],
    tags: [
        {
            type: String,
            match: /^[a-zA-Z0-9_-]+$/,
            lowercase: true,
            trim: true
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