const { StatusCodes } = require('http-status-codes')
const Vendor = require('../models/vendor')
const Product = require('../models/product')
const jwt = require('jsonwebtoken');

//getting all vendors to be displayed on the frontend
//no external configuration required,just call the url

const getAllVendors = async (req, res) => {
    const vendors = await Vendor.find({})
    return res.status(StatusCodes.OK).json(vendors)
}

//getting all the products
const getAllProducts = async (req, res) => {
    const products = await Product.find({});
    return res.status(StatusCodes.OK).json(products)
}

//getting products according to the mood to be displayed on the frontend
//req configuration:
//send the keyword to be searched in mood in form of query,eg, ?mood=sweet

const getProductsByMood = async (req, res) => {
    const products = await Product.find(req.query)
    return res.status(StatusCodes.OK).json(products)
}

//getting generic products to be displayed on the frontend
//req configuration:
//no header and body required at this stage

const getProducts = async (req, res) => {
    let products = await Product.find({ availability: "Available" });
    return res.status(StatusCodes.OK).json(products)
}

//controller to get a product from its id
//req configuration:
//send product id in form of raw json in body {"productID":"34r3fecsdf34"}

const getProductById = async (req, res) => {
    let { productID } = req.body;
    console.log(productID);
    let product = await Product.findById(productID);
    return res.status(StatusCodes.OK).json(product)
}


//controller to receive a token and find the role
//send an object in req.body {token:"fn240fi34o3ef"}

const verifyToken = async (req, res) => {
    const { token } = req.body;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(StatusCodes.OK).json({ "role": payload.role })
    } catch (error) {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You have not sent a valid token.')
    }
}



module.exports = { getAllVendors, getAllProducts, getProductsByMood, getProducts, getProductById, verifyToken }