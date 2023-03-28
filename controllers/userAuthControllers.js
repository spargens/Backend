const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");

//using this function a new user can join Macbease
//req configuration:
//we need to send four parameters in form of an object in the req.body
//eg- {"name":"Amartya","reg":12113246,"email":"amartyasingh1010@gmail.com","password":"Carpediem@408"}

const registerUser = async (req, res) => {
  const { name, reg, email } = req.body;
  const existingUser = await User.findOne({ name, reg, email });
  if (existingUser) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("Already a user with these credentials exist.");
  }
  const user = await User.create({
    ...req.body,
    // image:req.file.filename
  });
  const token = user.createJWT();
  return res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token });
};

//using this function the user can log in to his account
//req configuration:
//send login credentials in req body,eg, {"email":"1234@gmail.com","password":"1234"}

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).send("User does not exist.");
  }
  // const isPasswordCorrect = await user.comparePassword(password);
  // if (!isPasswordCorrect) {
  //   return res.status(StatusCodes.BAD_REQUEST).send("Wrong password.");
  // }
  const token = user.createJWT();
  return res.status(StatusCodes.OK).json({ user: { name: user.name }, token });
};

module.exports = { registerUser, loginUser };
