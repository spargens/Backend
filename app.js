require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();

const connectDB = require("./db/connect");

const authenticate = require("./middlewares/authentication");
const userAuthRouter = require("./routes/userAuthRouter");
const productUserRouter = require("./routes/productUserRouter");
const userRouter = require("./routes/userRouter");
const productVendorRouter = require("./routes/productVendorRouter");
const vendorRouter = require("./routes/vendorRouter");
const frontendRouter = require("./routes/frontendRouter");
const adminAuthRouter = require("./routes/adminAuthRouter");
const eventRouter = require("./routes/eventRouter");
const clubRouter = require("./routes/clubRouter");
const propsRouter = require('./routes/propsRouters');
const vendorRegisterRouter = require("./routes/vendorRegisterRouter");
const vendorLoginRouter = require("./routes/vendorLoginRouter");
const giftRouter = require("./routes/giftRouter");
const cardRouter = require("./routes/cardRouter");
const bagRouter = require("./routes/bagRouter");
const communityRouter = require("./routes/communityRouter");
const contentRouter = require("./routes/contentRouter");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("start");
});

app.use("/api/v1/auth/user", userAuthRouter);
app.use("/api/v1/auth/vendorL", vendorLoginRouter);
app.use("/api/v1/auth/vendorR", authenticate, vendorRegisterRouter);
app.use("/api/v1/productUser", authenticate, productUserRouter);
app.use("/api/v1/user", authenticate, userRouter);
app.use("/api/v1/productVendor", authenticate, productVendorRouter);
app.use("/api/v1/vendor", authenticate, vendorRouter);
app.use("/api/v1/frontend", frontendRouter);
app.use("/api/v1/admin", adminAuthRouter);
app.use("/api/v1/event", authenticate, eventRouter);
app.use("/api/v1/club", authenticate, clubRouter);
app.use("/api/v1/props", authenticate, propsRouter);
app.use("/api/v1/gifts", authenticate, giftRouter);
app.use("/api/v1/card", authenticate, cardRouter);
app.use("/api/v1/bag", authenticate, bagRouter);
app.use("/api/v1/community", authenticate, communityRouter);
app.use("/api/v1/content", authenticate, contentRouter);

const port = process.env.PORT || 5050;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening to the port ${port}.`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
