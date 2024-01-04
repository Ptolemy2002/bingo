const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: {
        type: String,
        match: /^[a-zA-Z0-9_-]+$/
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
        required: function() {
            return this.players.length > 0;
        },
        default: []
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
                    {
                        type: String,
                        match: /^.+$/
                    }
                ],
                default: []
            }
        }),
        default: {}
    }
});

module.exports = mongoose.model('games', GameSchema);