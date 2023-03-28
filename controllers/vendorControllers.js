const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const Vendor = require('../models/vendor')

const getVendors = async (req, res) => {
    if (req.user.role === 'user' || req.user.role === 'vendor') {
        const { name, shopNo } = req.query
        const queryObject = {}
        if (name) {
            queryObject.name = { $regex: name, $options: 'i' }
        }
        if (shopNo) {
            queryObject.shopNo = Number(shopNo)
        }
        console.log(queryObject)
        let result = Vendor.find(queryObject)
        fieldsList = "name email logo productsOwned"
        result = result.select(fieldsList)
        const finalResult = await result
        if (!finalResult) {
            return res.status(StatusCodes.NO_CONTENT).send('Nobody can match this profile even wildly.')
        }
        res.status(StatusCodes.OK).json({ finalResult })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to access the vendor profile.')
    }
}

const updateVendor = async (req, res) => {
    if (req.user.role === 'vendor') {
        const { name, email, logo, password } = req.body
        const vendorID = req.user.id
        const vendor = await Vendor.findOne({ _id: vendorID })
        if (!vendor) {
            return res.status(StatusCodes.BAD_REQUEST).send('Vendor to be updated is no more available.')
        }
        const updatedVendor = await Vendor.findByIdAndUpdate({ _id: vendorID }, req.body, { new: true, runValidators: true })
        res.status(StatusCodes.OK).json({ updatedVendor })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update vendor profile.')
    }
}

const deleteVendor = async (req, res) => {
    if (req.user.role === 'vendor') {
        const vendorID = req.user.id
        const vendor = await Vendor.findOne({ _id: vendorID })
        if (!vendor) {
            return res.status(StatusCodes.BAD_REQUEST).send('Vendor to be deleted is no more available.')
        }
        const deletedVendor = await Vendor.findByIdAndDelete({ _id: vendorID })
        res.status(StatusCodes.OK).json({ deletedVendor })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to delete vendor profile.')
    }
}

//controller to create priorities for the vendor
//req config
//send auth token as authorization Bearer ... in the header
//send data in body as raw json in the format {"priority":"xyz","time":"123"}

const createPriority = async (req, res) => {
    if (req.user.role === 'vendor') {
        const vendorID = req.user.id;
        const data = req.body;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err);
            vendor.priorities.push(data);
            vendor.save((err, update) => {
                if (err) return console.error(err);
                res.send("Priority created")
            })
        })
    }
}


//controller to fetch all the priorities to be displayed
//req config:
//send auth token as authorization Bearer ... in the header

const getPriorities = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err);
            else return res.json({ "priorities": vendor.priorities })
        })
    }
}


//controller to feed best three items(psuedo)
//req config:
//send auth token as authorization Bearer ... in the header
//send data in body as raw json in the format {"id": 3, "title": "Pastry", "cover":"https://b.zmtcdn.com/data/homepage_dish_data/4/f06d9a57b0847677e36f163a7b7fe54a.png","earned": "1500"}


const feedThreeBest = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        const data = req.body;
        console.log(vendorID);
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err);
            vendor.bestPerforming.push(data);
            vendor.save((err, update) => {
                if (err) return console.error(err);
                res.send("Priority created")
            })
        })
    }
}


const getThreebest = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err);
            else return res.json({ "priorities": vendor.bestPerforming })
        })
    }
}



module.exports = { getVendors, updateVendor, deleteVendor, createPriority, getPriorities, feedThreeBest, getThreebest }