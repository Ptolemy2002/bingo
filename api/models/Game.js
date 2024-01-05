const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: {
        type: String,
        match: /^[a-zA-Z0-9_-]+$/,
        lowercase: true,
        trim: true,
        minlength: 1
    },

    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 1
    },

    description: {
        type: String,
        default: ""
    },
    players: {
        type: [
            {
                type: String,
                trim: true,
                minlength: 1
            }
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
                trim: true,
                minlength: 1
            },
            description: {
                type: String,
                default: ""
            },
            spaces: {
                type: [
                    {
                        type: String,
                        trim: true,
                        minlength: 1
                    }
                ],
                default: []
            }
        }),
        default: {}
    }
});

module.exports = mongoose.model('games', GameSchema);