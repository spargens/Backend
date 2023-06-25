const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
    role: {
        type: String
    },
    name: {
        type: String,
        required: [true, "Please provide the admin name."]
    },
    email: {
        type: String,
        required: [true, "Please provide the email id of the admin."],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email",
        ],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide the password of the admin."],
    },
    image: {
        type: String,
        default: "xyz.com",
    },
    adminKey: {
        type: String,
        required: [true, "Please provide an admin key for the admin."]
    },
    //gifts {uid:"",senderId:"",receiverId:"",status:enum["vendor","locker","dispatched"]}
    gifts: {
        type: Array
    },
    clubs: {
        type: Array
    },
    //notifications {key:"",value:"",data:}
    notifications: {
        type: Array
    },
    unsortedWord: {
        type: Array
    },
    //[{communityId}]
    communitiesCreated: {
        type: Array
    },
    //[{communityId}]
    communitiesPartOf: {
        type: Array
    },
    //[{communityId,contentId}]
    communityContribution: {
        type: Array
    },
    //[{contentId,type:enum["community","club","gift","Macbease"]}]
    likedContents: {
        type: Array
    },
    //[{contentId,type:enum["community","club","gift","Macbease"],comment}]
    commentedContents: {
        type: Array
    },
    //[url]
    thrashUrls: {
        type: Array
    },
    lastActive: {
        type: String
    }
});

adminSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.createJWT = function () {
    return jwt.sign({ role: "admin", id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
};

adminSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

module.exports = mongoose.model("Admin", adminSchema);