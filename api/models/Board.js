const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
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
        trim: true
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
                trim: true,
                minlength: 1
            }
        ],
        required: true
    },

    markedMask: {
        type: String,
        match: /^[0-9]+n?$/,
        required: true,
        minlength: 1
    },

    game: {
        type: String,
        required: true,
        ref: "games"
    },
});

module.exports = mongoose.model('boards', BoardSchema);