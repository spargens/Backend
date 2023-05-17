const mongoose = require('mongoose');
const giftsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "You must provide a name to the gift."]
    },
    image: {
        type: String,
        required: [true, "You must provide an image to the gift."]
    },
    price: {
        type: Number,
        required: [true, "You must provide price of the gift."]
    },
    availability: {
        type: Boolean,
        default: true
    },
    discount: {
        type: Number
    }
})

module.exports = mongoose.model('Gifts', giftsSchema);