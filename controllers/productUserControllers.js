const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const Product = require('../models/product')
const User = require('../models/user')
const Vendor = require('../models/vendor')

const getProducts = async (req, res) => {
    if (req.user.role === 'user') {
        const { name, vendorName } = req.query
        const queryObject = {}
        if (name) {
            queryObject.name = { $regex: name, $options: 'i' }
        }
        if (vendorName) {
            queryObject.vendorName = { $regex: vendorName, $options: 'i' }
        }
        const results = await Product.find(queryObject)
        res.status(StatusCodes.OK).json({ results })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to read products on Macbease as a user.')
    }
}


//user can post star rating using this function for all those products he has already purchased
//req configuration:
//authorization token in req header
//send a query containing the productID to be star rated,eg, ?productID=6fsdjfkwe3489420
//you have to send star rating in req body in this form: {"reviews": [{ "star": "3.9" }]}

const reviewProduct = async (req, res) => {
    if (req.user.role === 'user') {
        const userID = req.user.id
        const { productID } = req.query
        const user = await User.findById(userID)
        const orderHistory = user.orderHistory
        const reviewHistory = user.reviewHistory
        if (!orderHistory) {
            return res.status(StatusCodes.BAD_REQUEST).send('You got to buy something first to review it.That is how it works.')
        }
        let isEligible = false
        orderHistory.forEach((element) => {
            let purchasedProductID = element.productID
            console.log(purchasedProductID)
            if (purchasedProductID === productID) {
                isEligible = true
                return isEligible
            }
        })
        if (!isEligible) {
            return res.status(StatusCodes.BAD_REQUEST).send('You have not yet purchased the product.So you cannot review it.')
        }
        const { reviews } = req.body
        const star = reviews[0].star
        console.log(star)
        if (!star) {
            return res.status(StatusCodes.BAD_REQUEST).send('To have a valid review you must enter valid star value.')
        }
        const reviewObjectForProductSchema = {}
        const reviewObjectForUserSchema = {}
        reviewObjectForProductSchema.star = star
        reviewObjectForProductSchema.userID = userID
        console.log(reviewObjectForProductSchema)
        reviewObjectForUserSchema.star = star
        reviewObjectForUserSchema.productID = productID
        console.log(reviewObjectForUserSchema)

        let updateOrNew = "new"

        reviewHistory.forEach((element) => {
            let reviewedProductID = element.productID
            if (reviewedProductID === productID) {
                updateOrNew = "update"
            }
        })

        if (updateOrNew === 'new') {
            Product.findById({ _id: productID }, (err, product) => {
                if (err) return console.log(err)
                product.reviews.push(reviewObjectForProductSchema)
                product.save()
                console.log(product)
            })

            User.findById({ _id: userID }, (err, user) => {
                if (err) return console.log(err)
                user.reviewHistory.push(reviewObjectForUserSchema)
                user.save()
                console.log(user)
            })
        }

        if (updateOrNew === 'update') {
            return res.status(StatusCodes.BAD_REQUEST).send('You have already reviewed the product.')
        }

        res.status(StatusCodes.OK).send('Review updated successfully.')
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to review products as you are not a user.')
    }
}

//user can post comments using this function for all those products he has already purchased
//req configuration:
//authorization token in req header
//send a query containing the productID to be star rated,eg, ?productID=6fsdjfkwe3489420
//you have to send star rating in req body in this form: {"comments": [{ "comment": "It was fucking awesome!" }]}


const commentProduct = async (req, res) => {
    if (req.user.role === 'user') {
        const userID = req.user.id
        const { productID } = req.query
        const user = await User.findById(userID)
        const orderHistory = user.orderHistory
        if (!orderHistory) {
            return res.status(StatusCodes.BAD_REQUEST).send('You got to buy something first to comment on it.This is how it works.')
        }
        let isEligible = false
        orderHistory.forEach((element) => {
            let purchasedProductID = element.productID
            if (purchasedProductID === productID) {
                isEligible = true
                return isEligible
            }
        })
        if (!isEligible) {
            return res.status(StatusCodes.BAD_REQUEST).send('You have not yet purchased the product.So you can not comment on it.')
        }
        const { comments } = req.body
        const comment = comments[0].comment
        if (!comment) {
            return res.status(StatusCodes.BAD_REQUEST).send('To have a valid comment you must enter some valid string value.')
        }
        const commentObject = {}
        commentObject.comment = comment
        commentObject.userID = userID

        Product.findById({ _id: productID }, (err, product) => {
            if (err) return console.error(err)
            product.comments.push(commentObject)
            product.save()
            console.log(product)
        })

        res.status(StatusCodes.OK).send('Comment updated successfully.')
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to comment on products as you are not registered as a user.')
    }
}

//user can add a food item to his cart using this function
//req configuration:
//authorization token in req header
//send a body data containing the productID to be added to the cart,eg, {"productID":fsdjfkwe3489420}


const addToCart = async (req, res) => {
    console.log(req);
    if (req.user.role === 'user') {
        const { productID } = req.body
        const userID = req.user.id
        let cartObject = {}
        cartObject.productID = productID
        User.findById({ _id: userID }, (err, user) => {
            if (err) return console.error(err)
            user.cart.push(cartObject)
            user.save();
        })
        return res.status(StatusCodes.OK).send('Successfully added to your cart.')
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry!Only registered users are given access to cart.')
    }
}

//user can delete a food item from his cart using this function
//req configuration:
//authorization token in req header
//send a body data containing the productID to be deleted from the cart,eg, {"productID":fsdjfkwe3489420}

const deleteFromCart = async (req, res) => {
    if (req.user.role === "user") {
        const { productID } = req.body;
        const userID = req.user.id;
        User.findById({ _id: userID }, (err, user) => {
            if (err) return console.error(err)
            let data = user.cart;
            console.log(data);
            let filteredData = data.filter((item) => item.productID != productID);
            console.log(filteredData);
            user.cart = filteredData;
            // user.cart.filter((item) => item != productID)
            user.save()
            return res.send("yesw")
        })
    }
}

//psuedo controller to get the cart data
//req configuration:
//authorization token in req header

const getCartData = async (req, res) => {
    if (req.user.role === "user") {
        const userID = req.user.id;
        User.findById(userID, (err, user) => {
            if (err) return console.error(err);
            let data = user.cart
            let extractID = data.map((item) => {
                let productID = item.productID
                return productID
            })
            return res.status(StatusCodes.OK).json(extractID)
        })

    }
}


//controller to feed the orders to vendor schema
//req configuration:
//authorization token in req header
//send a raw json file in req.body in format {"otp":"2315",orderID":1,"productID":"3er233fe3ef3f2","vendorID":"d2d3dj3ef3rfiorf","userName":"Amartya","foodName":"Pizza","pricePaid":"234","qty":2,"taken":"pending","status":"cooking","setTime":"","timeOfDelivery":"",dateOfDelivery:"30/12/22"}

const feedOrdersToVendor = async (req, res) => {
    if (req.user.role === "user") {
        let date = new Date();
        let day = date.getDate();
        day = day.toString();
        if (day.length === 1) {
            day = "0" + day;
        }
        let month = date.getMonth() + 1;
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        let year = date.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        const { otp, orderID, userID, productID, vendorID, userName, foodName, amtReceived, qty, taken, status, setTime, timeOfDelivery } = req.body;
        const data = { otp: otp, orderID: orderID, userID: userID, productID: productID, vendorID: vendorID, userName: userName, foodName: foodName, amtReceived: amtReceived, qty: qty, taken: taken, status: status, setTime: setTime, timeOfDelivery: timeOfDelivery, dateOfDelivery: currentDate }
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            vendor.orderHistory.push(data)
            vendor.save()
            return res.status(StatusCodes.OK).send("Order placed in the vendor schema!")
        })
    }
}


//controller to feed the orders to user schema
//req configuration:
//authorization token in req header
//send a raw json file in req.body in format {"otp":"2315","orderID":1,"productID":"3er233fe3ef3f2","vendorID":"d2d3dj3ef3rfiorf","userName":"Amartya","foodName":"Pizza",pricePaid":"234","qty":2,"taken":"pending","status":"cooking","setTime":"","timeOfDelivery":"",dateOfDelivery:"30/12/22"}

const feedOrdersToUser = async (req, res) => {
    if (req.user.role === "user") {
        let date = new Date();
        let day = date.getDate();
        day = day.toString();
        if (day.length === 1) {
            day = "0" + day;
        }
        let month = date.getMonth() + 1;
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        let year = date.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        const { otp, orderID, userID, productID, vendorID, userName, foodName, amtReceived, qty, taken, status, setTime, timeOfDelivery } = req.body;
        const data = { otp: otp, orderID: orderID, userID: userID, productID: productID, vendorID: vendorID, userName: userName, foodName: foodName, amtReceived: amtReceived, qty: qty, taken: taken, status: status, setTime: setTime, timeOfDelivery: timeOfDelivery, dateOfDelivery: currentDate }
        User.findById(userID, (err, user) => {
            if (err) return console.error(err)
            user.orderHistory.push(data)
            user.save()
            return res.status(StatusCodes.OK).send("Order placed in the user schema!")
        })
    }
}


module.exports = { getProducts, reviewProduct, commentProduct, addToCart, deleteFromCart, getCartData, feedOrdersToVendor, feedOrdersToUser }