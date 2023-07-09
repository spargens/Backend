const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const User = require('../models/user')

const getUser = async (req, res) => {
    if (req.user.role === 'user') {
        const { name, reg } = req.query
        console.log(name)
        console.log(reg)
        const queryObject = {}
        if (name) {
            queryObject.name = { $regex: name, $options: 'i' }
        }
        if (reg) {
            queryObject.reg = Number(reg)
        }
        console.log(queryObject)
        let result = User.find(queryObject)
        fieldsList = "name reg image"
        result = result.select(fieldsList)
        const finalResult = await result
        if (!finalResult) {
            return res.status(StatusCodes.NO_CONTENT).send('No body can match your profile even wildly.')
        }
        res.status(StatusCodes.OK).json({ finalResult })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to read other user profile')
    }

}

const updateUser = async (req, res) => {
    if (req.user.role === 'user') {
        const { name, email, password, image, phone, dob } = req.body
        const userID = req.user.id
        const user = await User.findOne({ _id: userID })
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).send('User to be updated is no more available.')
        }
        const updatedUser = await User.findByIdAndUpdate({ _id: userID }, req.body, { new: true, runValidators: true })
        res.status(StatusCodes.OK).json({ updatedUser })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update user profile.')
    }
}

const deleteUser = async (req, res) => {
    if (req.user.role === 'user') {
        const userID = req.user.id
        const user = await User.findOne({ _id: userID })
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).send('User to be deleted is no more available.')
        }
        const deletedUser = await User.findByIdAndDelete({ _id: userID })
        res.status(StatusCodes.OK).json({ deletedUser })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to delete user profile.')
    }
}

//controller to create new card of the user
//req config:
//send auth token as authorization Bearer ... in the header
//send a raw json file in the body like this {'card':"I love basketball"}

const createCard = async (req, res) => {
    if (req.user.role === "user") {
        const { card } = req.body
        // console.log(card)
        res.send("done")
        const userID = req.user.id;
        // console.log(userID);
        User.findById(userID, (err, user) => {
            if (err) return console.error(err);
            user.cards.push(card);
            user.save((err, update) => {
                if (err) return console.error(err);
            })
        })
    }
}


const deleteCard = async (req, res) => {
    if (req.user.role === "user") {
        res.send("yes");
        console.log(req.user.id);
    }
}


//controller to fetch all the cards to be displayed
//req config:
//send auth token as authorization Bearer ... in the header

const fetchCards = async (req, res) => {
    if (req.user.role === "user") {
        const userID = req.user.id;
        console.log(userID);
        User.findById(userID, (err, user) => {
            if (err) return console.error(err);
            else return res.json({ "cards": user.cards })
        })
    }
}

//controller to fetch your messages
//req config:
//send auth token as authorization Bearer ... in the header

const getYourMessages = async (req, res) => {
    if (req.user.role === "user") {
        const userId = req.user.id;
        User.findById(userId, (err, user) => {
            if (err) return console.error(err);
            else return res.json(user.messages)
        })
    }
}

//controller to fetch your messages
//req config:
//send auth token as authorization Bearer ... in the header
//send body in raw json with format {"receiverId":"123","text":"xyz"}

const postYourMessages = async (req, res) => {
    if (req.user.role === "user") {
        const userId = req.user.id;
        console.log(userId);
        const { receiverId, text } = req.body;
        console.log(receiverId);
        // console.log(text);
        const finalData = { sender: userId, receiver: receiverId, message: text }
        User.findById(userId, (err, user) => {
            if (err) return console.error(err);
            user.messages.push(finalData);
            // console.log(user.messages);
            user.save((err, update) => {
                if (err) return console.error(err);
                else return res.send("done");
            })
        })
        User.findById(receiverId, (err, user) => {
            if (err) return console.error(err);
            else {
                user.messages.push(finalData);
                user.save((err, update) => {
                    if (err) return console.error(err);
                })
            }
        })
    }
}


//psuedo controller to get an user just by sending his token in the header of the req

const getUserByToken = async (req, res) => {
    if (req.user.role === "user") {
        const userID = req.user.id;
        User.findById(userID, (err, user) => {
            if (err) return console.errror(err);
            return res.status(StatusCodes.OK).json(user)
        })
    }
}

//controller to search user by name
const searchUserByName = async (req, res) => {
    const { name } = req.query;
    const users = await User.find({ name: new RegExp(name, "i", "g") }, { name: 1, image: 1, _id: 1 });
    return res.status(StatusCodes.OK).json(users)
}

module.exports = { getUser, updateUser, deleteUser, createCard, deleteCard, fetchCards, getYourMessages, postYourMessages, getUserByToken, searchUserByName }
