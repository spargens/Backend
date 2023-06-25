const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
    creatorId: {
        type: String
    },
    creatorPos: {
        type: String,
        enum: ["user", "admin"]
    },
    title: {
        type: String
    },
    cover: {
        type: String
    },
    secondaryCover: {
        type: String
    },
    label: {
        type: String
    },
    createdOn: {
        type: Date
    },
    //[{contentId,irrelevanceVote}]
    content: {
        type: Array
    },
    members: {
        type: Array
    },
    //["sports","coding"]
    tag: {
        type: Array
    },
    activeMembers: {
        type: Number,
        default: 0
    }
});


module.exports = mongoose.model("Community", communitySchema);