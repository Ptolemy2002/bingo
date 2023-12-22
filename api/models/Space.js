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
        {
            type: String
        }
    ],
    aliases: [
        {
            type: String
        }
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

module.exports = mongoose.model('spaces', SpaceSchema);