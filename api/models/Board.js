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
        trim: true,
        minlength: 1
    },

    width: {
        type: Number,
        required: true,
        min: 1,
        max: 11
    },

    height: {
        type: Number,
        required: true,
        min: 1,
        max: 11
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
        type: [Boolean],
        required: function() {
            return this.width * this.height === this.markedMask.length;
        },
        minlength: 1
    },

    game: {
        type: String,
        required: true,
        ref: "games"
    },

    owner: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }
});

module.exports = mongoose.model('boards', BoardSchema);