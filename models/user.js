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
    default: 0000,
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
    foodName: { type: String },
    amtReceived: { type: Number, required: [true, 'Amount received must be logged explicitly in order history console.'] },
    qty: { type: Number },
    taken: { type: String, enum: ['accepted', 'declined', 'pending'], default: 'pending' },
    status: { type: String, enum: ['cooking', 'ready', 'delivered'], default: 'cooking' },
    setTime: { type: Number, default: 0 },
    timeOfDelivery: { type: String },
    dateOfDelivery: { type: String }
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
