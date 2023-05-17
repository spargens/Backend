const mongoose = require('mongoose');
const cardSchema = new mongoose.Schema({
    value: {
        type: String
    },
    creator: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    tags: {
        type: Array
    },
    //[userId]
    likedBy: {
        type: Array
    }
})

module.exports = mongoose.model("Card", cardSchema);