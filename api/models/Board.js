const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { isAlphanumeric } = require('lib/regex');

const BoardSchema = new Schema({
    _id: {
        type: String,
        required: [isAlphanumeric, 'Board ID must be alphanumeric'],
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
            String
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