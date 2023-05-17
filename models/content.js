const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
    contentType: {
        type: String,
        enum: ["text", "image", "video"],
        required: [true, "Please provide the content type."]
    },
    url: {
        type: String
    },
    text: {
        type: String
    },
    //[{msg:"",id}]
    comments: {
        type: Array
    },
    //[id]
    likes: {
        type: Array
    },
    //["Technology","Sports"]
    tags: {
        type: Array
    },
    sendBy: {
        type: String,
        enum: ["user", "club", "Macbease", "userGift"],
        required: [true, "Please provide who send the content."]
    },
    //name of the community or club it belongs to
    belongsTo: {
        type: String
    },
    idOfSender: {
        type: String,
        required: [true, "Please provide the id of the sender."]
    },
    useful: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Content", contentSchema);