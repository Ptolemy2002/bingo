const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { isAlphanumeric } = require('lib/regex');

const GameSchema = new Schema({
    _id: {
        type: String,
        required: [isAlphanumeric, 'Game ID must be alphanumeric'],
    },

    name: {
        type: String,
        required: true,
        unique: true
    },

    description: String,
    players: {
        type: [
            String
        ],
        required: [(v) => v.length > 0, 'Players must not be empty'],
    },

    spacePools: {
        type: Map,
        of: new Schema({
            name: {
                type: String,
                required: true,
            },
            description: String,
            spaces: {
                type: [
                    String
                ],
                default: []
            }
        }),
        default: {}
    }
});

module.exports = mongoose.model('games', GameSchema);