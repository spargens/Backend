const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
  },
  name: {
    type: String,
    required: [true, "Please provide the user name."],
  },
  reg: {
    type: Number,
    required: [true, "Please provide the registration number."],
  },
  course: {
    type: String
  },
  email: {
    type: String,
    required: [true, "Please provide the email id."],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide the password."],
  },
  image: {
    type: String,
    default: "xyz.com",
  },
  phone: {
    type: Number,
  },
  dob: {
    type: Date,
    default: 1 - 1 - 2000,
  },
  orderHistory: [{
    otp: { type: Number },
    orderID: { type: String },
    userID: { type: String, ref: 'User' },
    productID: { type: String, ref: 'Product' },
    vendorID: { type: String, ref: 'Vendor' },
    userName: { type: String },
    productName: { type: String },
    amtReceived: { type: Number, required: [true, 'Amount received must be logged explicitly in order history console.'] },
    qty: { type: Number },
    taken: { type: String, enum: ['accepted', 'declined', 'pending', 'delivered'], default: 'pending' },
    status: { type: String, enum: ['cooking', 'ready', 'delivered'], default: 'cooking' },
    setTime: { type: Number, default: 0 },
    timeOfDelivery: { type: String },
    dateOfDelivery: { type: String },
    category: { type: String, enum: ["gift", "food"] },
    giftUid: { type: String }
  }],
  cart: {
    type: Array,
  },
  invitations: [
    {
      userID: { type: mongoose.Types.ObjectId, ref: "User" },
      message: {
        type: String,
        required: [true, "Invitation can not be saved without message."],
      },
      receiving: { type: Date, default: Date.now() },
    },
  ],
  reviewHistory: {
    type: Array,
  },
  cards: {
    type: Array,
  },
  messages: {
    type: Array,
  },
  credibilityScore: {
    type: Number,
    default: 5
  },
  //propOrder {id:"P-1",otp:8183,name:"Projector",time:"Night Shift",status:"Received"(enum["Yet to be dispatched","Dispatched"]),remark:"",logId:"",date:"",reviewed:false}
  propOrder: {
    type: Array,
  },
  //giftsSend {uid:"",text:"",receiverId:"",status:enum["send","accepted","declined","received","reacted"],code:"",locker:"",reaction:"",productsAttached:enum[true,false],productId:"",anonymous:enum[true,false]}
  giftsSend: {
    type: Array
  },
  //giftsSend {statusMsg:"",uid:"",text:"",senderId:"",status:enum["send","accepted","declined","received","reacted"],code:"",locker:"",reaction:"",productsAttached:enum[true,false],productId:"",anonymous:enum[true,false]}
  giftsReceived: {
    type: Array
  },
  //notifications {key:"",value:"",data:}
  notifications: {
    type: Array
  },
  //clubs you are part of...[{clubId}]
  clubs: {
    type: Array
  },
  //blocked user from sending gifts ["user_id","user_id"]
  blockList: {
    type: Array
  },
  likedCards: {
    type: Array
  },
  //[{communityId}]
  communitiesCreated: {
    type: Array
  },
  //[{communityId,bestStreak,currentStreak,lastPosted,totalLikes,totalPosts,rating}]
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
  //["Ai and Ml","Universe","Movies"]
  interests: {
    type: Array
  },
  lastActive: {
    type: String
  }
});

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.createJWT = function () {
  return jwt.sign({ role: "user", id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", userSchema);
