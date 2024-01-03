const mongoose = require('mongoose');
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
            required: function(t) {
                return /^(\w|-)+$/.test(t);
            }
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