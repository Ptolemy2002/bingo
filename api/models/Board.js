const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
    _id: {
        type: String,
        match: /^[a-zA-Z0-9_-]+$/
    },

    name: {
        type: String,
        required: true,
        unique: true
    },

    width: {
        type: Number,
        required: true,
        min: 1
    },

    height: {
        type: Number,
        required: true,
        min: 1
    },

    spaceNames: {
        type: [
            {
                type: String,
                match: /^.+$/
            }
        ],
        required: true
    },

    markedMask: {
        type: String,
        required: true
    },

    game: {
        type: String,
        required: true,
        ref: "games"
    },
});

module.exports = mongoose.model('boards', BoardSchema);