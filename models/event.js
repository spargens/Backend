const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
    event: {
        type: String,
        required: [true, "Please provide the name of the event!"]
    },
    image: {
        type: String
    },
    dateInWords: {
        type: String,
        required: [true, "You must provide the date and time for the event!"]
    },
    date: {
        type: Date,
        required: [true, "You must provide the date for chronological sorting!"]
    },
    dlAvailable: {
        type: Boolean,
        required: [true, "You must provide the status for D.l."]
    },
    dlTime: {
        type: String
    },
    place: {
        type: String,
        required: [true, "You must provide the venue of the event!"]
    },
    participate: {
        type: String
    },
    tags: {
        type: Array
    },
    formAvail: {
        type: Boolean,
        required: [true, "You must provide the status for form."]
    }
});

module.exports = mongoose.model('Event', eventSchema);