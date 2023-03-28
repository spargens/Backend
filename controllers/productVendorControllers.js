const { StatusCodes } = require('http-status-codes')
const Product = require('../models/product');
const Vendor = require('../models/vendor');
const User = require('../models/user');
const { cloneUniformsGroups } = require('three');
const vendor = require('../models/vendor');


//vendor can create a new product using this function
//req configuration:
//authorization token in req header
//properties of new product is send in req body
//minimum properties: name,price,discount,cover,tag
//maximum properties: name,image,price,mood[<keyword>],timeFactor[breakfast,lunch,snacks,dinner],vendorName

const createProduct = async (req, res) => {
    if (req.user.role === 'vendor') {
        const { name, price, discount, cover, tag } = req.body
        if (!name || !price) {
            return res.status(StatusCodes.BAD_REQUEST).send('To create a new product you must enter name,price and vendor name.')
        }
        req.body.vendor = req.user.id
        const product = await Product.create({
            ...req.body
        })
        const findNewlyCreatedProduct = await Product.findOne({ name: name, vendor: req.user.id })
        let data = findNewlyCreatedProduct._id;
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err);
            vendor.productsOwned.push(data);
            vendor.nameOfProductsOwned.push(name);
            vendor.save((err, update) => {
                if (err) return console.error(err);
            })
        })
        res.status(StatusCodes.CREATED).json({ product })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to create product.')
    }
}

const getProducts = async (req, res) => {
    if (req.user.role === 'vendor') {
        const { name } = req.query
        const vendorID = req.user.id
        const queryObject = {}
        if (name) {
            queryObject.name = { $regex: name, $options: 'i' }
        }
        queryObject.vendor = vendorID
        console.log(queryObject)
        const results = await Product.find(queryObject)
        res.status(StatusCodes.OK).json({ results })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to read products on Macbease as a vendor.')
    }
}


//controller to update a product
//req config:
//send auth token as authorization Bearer ... in the header
//send productID in req.query
//send data in form of raw json in the req.body in format {"price": 40}


const updateProduct = async (req, res) => {
    if (req.user.role === 'vendor') {
        const { productID } = req.query
        console.log(productID)
        const vendorID = req.user.id
        const product = await Product.findById({ _id: productID })
        if (!product) {
            return res.status(StatusCodes.BAD_REQUEST).send('Product to be updated does not exist.')
        }
        if (product.vendor === vendorID) {
            return res.status(StatusCodes.BAD_REQUEST).send('You are not authorized to update this product as it is owned by another vendor.')
        }
        const updatedProduct = await Product.findByIdAndUpdate({ _id: productID }, { ...req.body }, { new: true, runValidator: true })
        res.status(StatusCodes.OK).json({ updatedProduct })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update products.')
    }
}


//controller to delete a particular product
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"productID": "63bd7eaec66f0ce4dcb53386"}

const deleteProduct = async (req, res) => {
    if (req.user.role === "vendor") {
        const { productID } = req.body
        const vendorID = req.user.id
        const product = await Product.findById({ _id: productID })
        if (!product) {
            return res.status(StatusCodes.BAD_REQUEST).send('This product does not exist.')
        }
        const deletedProduct = await Product.findByIdAndRemove({ _id: productID })
        res.status(StatusCodes.OK).json({ deletedProduct })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to delete the product.')
    }

}

//psuedo controller to make api call to fetch all the products owned by the vendor
//req config:
//send auth token as authorization Bearer ... in the header

const getAllProducts = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        let allProducts = await Product.find({ vendor: vendorID })
        return res.status(StatusCodes.OK).json(allProducts)
    }
}


//psuedo controller to feed the week performance into the product schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"unitsSoldThisWeek": "63bd7eaec66f0ce4dcb53386"}

const thisWeekPerformance = async (req, res) => {
    if (req.user.role === "vendor") {
        const { productID, unitsSoldThisWeek, week } = req.body;
        Product.findById(productID, (err, product) => {
            if (err) return console.error(err);
            product.soldThisWeek.push(unitsSoldThisWeek);
            product.save((err, update) => {
                if (err) return console.error(err);
                else return res.status(StatusCodes.OK).send("Week performance data has been aired!")
            })
        })
        res.send("done")
    }
}


//controller to accept an order and reflect in vendor schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"orderID":0} 

const acceptOrderVendor = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        const { orderID } = req.body;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            const orderHistory = vendor.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.taken = "accepted";
                }
            })
            vendor.save();
            return res.status(StatusCodes.OK).send("Order accepted in vendor schema!")
        })
    }
}


//controller to accept an order and reflect in user schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"userID":"d3e4324f32","orderID":0} 

const acceptOrderUser = async (req, res) => {
    if (req.user.role === "vendor") {
        const { userID, orderID } = req.body;
        User.findById(userID, (err, user) => {
            if (err) return console.error(err)
            const orderHistory = user.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.taken = "accepted";
                }
            })
            user.save();
            return res.status(StatusCodes.OK).send("Order accepted in user schema!")
        })
    }
}



//controller to decline an order and reflect in vendor schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"orderID":0} 

const declineOrderVendor = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        const { orderID } = req.body;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            const orderHistory = vendor.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.taken = "declined";
                }
            })
            vendor.save();
            return res.status(StatusCodes.OK).send("Order was declined in vendor schema!")
        })
    }
}




//controller to decline an order and reflect in user schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"userID":"d3e4324f32","orderID":0} 

const declineOrderUser = async (req, res) => {
    if (req.user.role === "vendor") {
        const { userID, orderID } = req.body;
        User.findById(userID, (err, user) => {
            if (err) return console.error(err)
            const orderHistory = user.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.taken = "declined";
                }
            })
            user.save();
            return res.status(StatusCodes.OK).send("Order was declined in user schema!")
        })
    }
}



//controller to set time for an order and reflect it in vendor schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"orderID":0,"timeNeeded":10} 

const setTimeVendor = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        let { orderID, timeNeeded } = req.body;
        timeAsked = parseInt(timeNeeded);
        console.log("time asked", timeAsked);
        const date = new Date().toString().slice(16, 24);
        let hour = date.slice(0, 2);
        hour = parseInt(hour);
        let minutes = date.slice(3, 5);
        minutes = parseInt(minutes);
        if ((minutes + timeAsked) < 60) minutes = minutes + timeAsked;
        if ((minutes + timeAsked) >= 60) { hour = hour + 1; minutes = minutes + timeAsked - 60 }
        hour = hour.toString();
        minutes = minutes.toString();
        console.log("minutes", minutes);
        if (minutes.length === 1) {
            console.log("length of minutes", minutes.length);
            minutes = "0" + minutes;
            console.log("after transformation", minutes);
        }
        // if (hour === "24") {
        //     hour = "00";
        // }
        let finalTime = hour + ":" + minutes;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            const orderHistory = vendor.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.setTime = timeNeeded;
                    console.log("data to be pushed", finalTime);
                    item.timeOfDelivery = finalTime;
                }
            })
            vendor.save();
            return res.status(StatusCodes.OK).send("Time is set in vendor schema!")
        })
    }
}


//controller to set time for an order and reflect it in user schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"userID":"d3e4324f32","orderID":0,"timeNeeded":10} 

const setTimeUser = async (req, res) => {
    if (req.user.role === "vendor") {
        const { userID, orderID, timeNeeded } = req.body;
        timeAsked = parseInt(timeNeeded);
        // console.log("timeAsked", timeAsked);
        const date = new Date().toString().slice(16, 24);
        let hour = date.slice(0, 2);
        hour = parseInt(hour);
        // console.log("hour", hour);
        let minutes = date.slice(3, 5);
        minutes = parseInt(minutes);
        // console.log("minutes", minutes);
        if ((minutes + timeAsked) < 60) {
            minutes = minutes + timeAsked;
            // console.log("after logic", minutes);
        }
        if ((minutes + timeAsked) >= 60) {
            hour = hour + 1;
            minutes = minutes + timeAsked - 60;
            // console.log("after logic", minutes);
        }
        hour = hour.toString();
        minutes = minutes.toString();
        // console.log("minutes", minutes);
        if (minutes.length === 1) {
            // console.log("length of minutes", minutes.length);
            minutes = "0" + minutes;
            // console.log("after transformation", minutes);
        }
        // hour = hour.toString();
        // if (hour.length === 1) {
        //     console.log("length of hour", hour.length);
        //     hour = "0" + hour;
        //     console.log("after transformation", hour);
        // }
        let finalTime = hour + minutes;
        // console.log("finalTime", finalTime);
        User.findById(userID, (err, user) => {
            if (err) return console.error(err)
            const orderHistory = user.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.setTime = timeNeeded;
                    // console.log("final data to be pushed", finalTime);
                    item.timeOfDelivery = finalTime;
                }
            })
            user.save();
            return res.status(StatusCodes.OK).send("Time is set in user schema!")
        })
    }
}


//controller to set status of an order to ready and reflect it in vendor schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"orderID":0} 

const orderCompletedVendor = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        const { orderID } = req.body;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            const orderHistory = vendor.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.status = "ready";
                }
            })
            vendor.save();
            return res.status(StatusCodes.OK).send("Order is ready in vendor schema!")
        })
    }
}



//controller to set status of an order to ready and reflect it in vendor schema
//req config:
//send auth token as authorization Bearer ... in the header
//send data in form of raw json in the req.body in format {"userID":"dwf324f79g23","orderID":0} 

const orderCompletedUser = async (req, res) => {
    if (req.user.role === "vendor") {
        const { userID, orderID } = req.body;
        User.findById(userID, (err, user) => {
            if (err) return console.error(err)
            const orderHistory = user.orderHistory;
            orderHistory.map((item) => {
                if (item.orderID === orderID) {
                    item.status = "ready";
                }
            })
            user.save();
            return res.status(StatusCodes.OK).send("Order is ready in user schema!")
        })
    }
}


//psuedo controller to fetch all the orders
//req config:
//send auth token as authorization Bearer ... in the header

const getAllOrders = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            return res.status(StatusCodes.OK).json(vendor.orderHistory)

        })
    }
}


//controller to get the average visitors 
//req config:
//send auth token as authorization Bearer ... in the header

const getAverageVisitors = async (req, res) => {
    if (req.user.role === "vendor") {
        let lastSixDates = getLastSixDates();
        let lastSixDaysVisitors = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err)
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                if (date === lastSixDates[0]) {
                    lastSixDaysVisitors[0] = lastSixDaysVisitors[0] + 1;
                }
                else if (date === lastSixDates[1]) {
                    lastSixDaysVisitors[1] = lastSixDaysVisitors[1] + 1;
                }
                else if (date === lastSixDates[2]) {
                    lastSixDaysVisitors[2] = lastSixDaysVisitors[2] + 1;
                }
                else if (date === lastSixDates[3]) {
                    lastSixDaysVisitors[3] = lastSixDaysVisitors[3] + 1;
                }
                else if (date === lastSixDates[4]) {
                    lastSixDaysVisitors[4] = lastSixDaysVisitors[4] + 1;
                }
                else if (date === lastSixDates[5]) {
                    lastSixDaysVisitors[5] = lastSixDaysVisitors[5] + 1;
                }
            })
            lastSixDates = convertDatesIntoWords(lastSixDates);
            return res.status(StatusCodes.OK).json({ "dates": lastSixDates, "avgVisitors": lastSixDaysVisitors })

        })
    }
}


//controller to get the average visitors of last six weeks
//req config:
//send auth token as authorization Bearer ... in the header

const getAverageVisitorsForSixWeeks = async (req, res) => {
    if (req.user.role === "vendor") {
        let last42Days = getLast42Days();
        let lastSixWeeksVisitors = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err);
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                date = date.slice(0, 5);
                if (date === last42Days[0] || date === last42Days[1] || date === last42Days[2] || date === last42Days[3] || date === last42Days[4] || date === last42Days[5] || date === last42Days[6]) {
                    lastSixWeeksVisitors[0] = lastSixWeeksVisitors[0] + 1;
                }
                else if (date === last42Days[7] || date === last42Days[8] || date === last42Days[9] || date === last42Days[10] || date === last42Days[11] || date === last42Days[12] || date === last42Days[13]) {
                    lastSixWeeksVisitors[1] = lastSixWeeksVisitors[1] + 1;
                }
                else if (date === last42Days[14] || date === last42Days[15] || date === last42Days[16] || date === last42Days[17] || date === last42Days[18] || date === last42Days[19] || date === last42Days[20]) {
                    lastSixWeeksVisitors[2] = lastSixWeeksVisitors[2] + 1;
                }
                else if (date === last42Days[21] || date === last42Days[22] || date === last42Days[23] || date === last42Days[24] || date === last42Days[25] || date === last42Days[26] || date === last42Days[27]) {
                    lastSixWeeksVisitors[3] = lastSixWeeksVisitors[3] + 1;
                }
                else if (date === last42Days[28] || date === last42Days[29] || date === last42Days[30] || date === last42Days[31] || date === last42Days[32] || date === last42Days[33] || date === last42Days[34]) {
                    lastSixWeeksVisitors[4] = lastSixWeeksVisitors[4] + 1;
                }
                else if (date === last42Days[35] || date === last42Days[36] || date === last42Days[37] || date === last42Days[38] || date === last42Days[39] || date === last42Days[40] || date === last42Days[41]) {
                    lastSixWeeksVisitors[5] = lastSixWeeksVisitors[5] + 1;
                }
            })
            let last6Weeks = getLastSixWeeks(last42Days);
            return res.status(StatusCodes.OK).json({ "dates": last6Weeks, "avgVisitors": lastSixWeeksVisitors })
        })

    }
}


//controller to get the average visitors of last six months
//req config:
//send auth token as authorization Bearer ... in the header

const getAverageVisitorsForSixMonths = async (req, res) => {
    if (req.user.role === "vendor") {
        let last6Months = getLastSixMonths();
        let lastSixMonthsVisitor = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err)
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                date = date.slice(3);
                if (date === last6Months[0]) {
                    lastSixMonthsVisitor[0] = lastSixMonthsVisitor[0] + 1;
                }
                else if (date === last6Months[1]) {
                    lastSixMonthsVisitor[1] = lastSixMonthsVisitor[1] + 1;
                }
                else if (date === last6Months[2]) {
                    lastSixMonthsVisitor[2] = lastSixMonthsVisitor[2] + 1;
                }
                else if (date === last6Months[3]) {
                    lastSixMonthsVisitor[3] = lastSixMonthsVisitor[3] + 1;
                }
                else if (date === last6Months[4]) {
                    lastSixMonthsVisitor[4] = lastSixMonthsVisitor[4] + 1;
                }
                else if (date === last6Months[5]) {
                    lastSixMonthsVisitor[5] = lastSixMonthsVisitor[5] + 1;
                }

            })
            return res.status(StatusCodes.OK).json({ "dates": last6Months, "avgVisitors": lastSixMonthsVisitor });
        })

    }
}


//controller to get the revenue generated in last six days
//req config:
//send auth token as authorization Bearer ... in the header

const getRevenueFor6Days = async (req, res) => {
    if (req.user.role === "vendor") {
        let lastSixDates = getLastSixDates();
        let lastSixDaysRevenue = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err)
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                if (date === lastSixDates[0]) {
                    lastSixDaysRevenue[0] = lastSixDaysRevenue[0] + item.amtReceived;
                }
                else if (date === lastSixDates[1]) {
                    lastSixDaysRevenue[1] = lastSixDaysRevenue[1] + item.amtReceived;
                }
                else if (date === lastSixDates[2]) {
                    lastSixDaysRevenue[2] = lastSixDaysRevenue[2] + item.amtReceived;
                }
                else if (date === lastSixDates[3]) {
                    lastSixDaysRevenue[3] = lastSixDaysRevenue[3] + item.amtReceived;
                }
                else if (date === lastSixDates[4]) {
                    lastSixDaysRevenue[4] = lastSixDaysRevenue[4] + item.amtReceived;
                }
                else if (date === lastSixDates[5]) {
                    lastSixDaysRevenue[5] = lastSixDaysRevenue[5] + item.amtReceived;
                }

            })
            lastSixDates = convertDatesIntoWords(lastSixDates);
            return res.status(StatusCodes.OK).json({ "dates": lastSixDates, "revenueGenerated": lastSixDaysRevenue })
        })
    }
}



//controller to get the revenue generated in last six days
//req config:
//send auth token as authorization Bearer ... in the header

const getRevenueFor6Weeks = async (req, res) => {
    if (req.user.role === "vendor") {
        let last42Days = getLast42Days();
        let lastSixWeeksRevenue = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err);
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                date = date.slice(0, 5);
                if (date === last42Days[0] || date === last42Days[1] || date === last42Days[2] || date === last42Days[3] || date === last42Days[4] || date === last42Days[5] || date === last42Days[6]) {
                    lastSixWeeksRevenue[0] = lastSixWeeksRevenue[0] + item.amtReceived;
                }
                else if (date === last42Days[7] || date === last42Days[8] || date === last42Days[9] || date === last42Days[10] || date === last42Days[11] || date === last42Days[12] || date === last42Days[13]) {
                    lastSixWeeksRevenue[1] = lastSixWeeksRevenue[1] + item.amtReceived;
                }
                else if (date === last42Days[14] || date === last42Days[15] || date === last42Days[16] || date === last42Days[17] || date === last42Days[18] || date === last42Days[19] || date === last42Days[20]) {
                    lastSixWeeksRevenue[2] = lastSixWeeksRevenue[2] + item.amtReceived;
                }
                else if (date === last42Days[21] || date === last42Days[22] || date === last42Days[23] || date === last42Days[24] || date === last42Days[25] || date === last42Days[26] || date === last42Days[27]) {
                    lastSixWeeksRevenue[3] = lastSixWeeksRevenue[3] + item.amtReceived;
                }
                else if (date === last42Days[28] || date === last42Days[29] || date === last42Days[30] || date === last42Days[31] || date === last42Days[32] || date === last42Days[33] || date === last42Days[34]) {
                    lastSixWeeksRevenue[4] = lastSixWeeksRevenue[4] + item.amtReceived;
                }
                else if (date === last42Days[35] || date === last42Days[36] || date === last42Days[37] || date === last42Days[38] || date === last42Days[39] || date === last42Days[40] || date === last42Days[41]) {
                    lastSixWeeksRevenue[5] = lastSixWeeksRevenue[5] + item.amtReceived;
                }
            })
            let last6Weeks = getLastSixWeeks(last42Days);
            return res.status(StatusCodes.OK).json({ "dates": last6Weeks, "revenueGenerated": lastSixWeeksRevenue })
        })
    }
}



//controller to get the revenue generated in last six months
//req config:
//send auth token as authorization Bearer ... in the header

const getRevenueFor6Months = async (req, res) => {
    if (req.user.role === "vendor") {
        let last6Months = getLastSixMonths();
        let lastSixMonthsRevenue = [0, 0, 0, 0, 0, 0];
        Vendor.findById(req.user.id, (err, vendor) => {
            if (err) return console.error(err)
            const logBookData = vendor.orderHistory;
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                date = date.slice(3);
                if (date === last6Months[0]) {
                    lastSixMonthsRevenue[0] = lastSixMonthsRevenue[0] + item.amtReceived;
                }
                else if (date === last6Months[1]) {
                    lastSixMonthsRevenue[1] = lastSixMonthsRevenue[1] + item.amtReceived;
                }
                else if (date === last6Months[2]) {
                    lastSixMonthsRevenue[2] = lastSixMonthsRevenue[2] + item.amtReceived;
                }
                else if (date === last6Months[3]) {
                    lastSixMonthsRevenue[3] = lastSixMonthsRevenue[3] + item.amtReceived;
                }
                else if (date === last6Months[4]) {
                    lastSixMonthsRevenue[4] = lastSixMonthsRevenue[4] + item.amtReceived;
                }
                else if (date === last6Months[5]) {
                    lastSixMonthsRevenue[5] = lastSixMonthsRevenue[5] + item.amtReceived;
                }

            })
            return res.status(StatusCodes.OK).json({ "dates": last6Months, "revenueGenerated": lastSixMonthsRevenue });
        })

    }
}


//controller to get the bestPerformingItems for last six days
//req config:
//send auth token as authorization Bearer ... in the header
//send a parameter in req.body e.g, parameter:"week",parameter:"month",parameter:"6months"
//send a highOrLow in req.body e.g, highOrLow:"high" to calculate best performing and highOrLow:"low" to calculate least performing

const getBestPerforming = async (req, res) => {
    if (req.user.role === "vendor") {
        const vendorID = req.user.id;
        const { parameter, highOrLow } = req.body;
        let revenueGenerated = [];
        Vendor.findById(vendorID, (err, vendor) => {
            if (err) return console.error(err)
            const productsName = vendor.nameOfProductsOwned;
            const logBookData = vendor.orderHistory;
            for (let i = 0; i < productsName.length; i++) {
                revenueGenerated[i] = 0;
            }
            logBookData.map((item) => {
                let date = item.dateOfDelivery;
                if (parameter === "week") {
                    let lastSixDates = getLastSixDates();
                    console.log(date);
                    for (let j = 0; j < productsName.length; j++) {
                        if (productsName[j] === item.foodName) {
                            revenueGenerated[j] = revenueGenerated[j] + item.amtReceived;
                        }
                    }
                }
                else if (parameter === "month") {
                    let thisDate = new Date();
                    let thisMonth = thisDate.getMonth() + 1;
                    thisMonth = thisMonth.toString();
                    if (thisMonth.length === 1) {
                        thisMonth = "0" + thisMonth;
                    }
                    let month = date.slice(3, 5);
                    if (thisMonth === month) {
                        for (let j = 0; j < productsName.length; j++) {
                            if (productsName[j] === item.foodName) {
                                revenueGenerated[j] = revenueGenerated[j] + item.amtReceived;
                            }
                        }
                    }
                }
                else if (parameter === "6months") {
                    let last6Months = getLastSixMonths();
                    date = date.slice(3);
                    if (date === last6Months[0] || date === last6Months[1] || date === last6Months[2] || date === last6Months[3] || date === last6Months[4] || date === last6Months[5]) {
                        for (let j = 0; j < productsName.length; j++) {
                            if (productsName[j] === item.foodName) {
                                revenueGenerated[j] = revenueGenerated[j] + item.amtReceived;
                            }
                        }
                    }
                }
            })
            if (highOrLow === "high") {
                let topThreeRevenue = threeLargest(revenueGenerated, revenueGenerated.length);
                let xAxisData = [];
                let yAxisData = [];
                xAxisData[0] = productsName[topThreeRevenue[0].index];
                xAxisData[1] = productsName[topThreeRevenue[1].index];
                xAxisData[2] = productsName[topThreeRevenue[2].index];
                yAxisData[0] = topThreeRevenue[0].value;
                yAxisData[1] = topThreeRevenue[1].value;
                yAxisData[2] = topThreeRevenue[2].value;
                return res.status(StatusCodes.OK).json({ "xAxisData": xAxisData, "yAxisData": yAxisData })
            }
            if (highOrLow === "low") {
                let leastThreeRevenue = threeLowest(revenueGenerated, revenueGenerated.length);
                let xAxisData = [];
                let yAxisData = [];
                xAxisData[0] = productsName[leastThreeRevenue[0].index];
                xAxisData[1] = productsName[leastThreeRevenue[1].index];
                xAxisData[2] = productsName[leastThreeRevenue[2].index];
                yAxisData[0] = leastThreeRevenue[0].value;
                yAxisData[1] = leastThreeRevenue[1].value;
                yAxisData[2] = leastThreeRevenue[2].value;
                return res.status(StatusCodes.OK).json({ "xAxisData": xAxisData, "yAxisData": yAxisData })
            }
        })
    }
}


//generic function to get the largest three element from an array

function threeLargest(arr, arr_size) {
    let first = arr[0];
    let firstAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] > first) {
            first = arr[i];
            firstAddress = i;
        }
    }
    let second = Number.MIN_VALUE;
    let secondAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] > second && arr[i] < first) {
            second = arr[i];
            secondAddress = i;
        }
    }
    let third = Number.MIN_VALUE;
    let thirdAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] > third && arr[i] < second) {
            third = arr[i];
            thirdAddress = i;
        }
    }
    let dataObject = [{ "value": first, "index": firstAddress }, { "value": second, "index": secondAddress }, { "value": third, "index": thirdAddress }]
    return dataObject
}


//generic function to get the three lowest element from an array

function threeLowest(arr, arr_size) {
    let first = arr[0];
    let firstAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] < first) {
            first = arr[i];
            firstAddress = i;
        }
    }
    let second = Number.MAX_VALUE;
    let secondAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] < second && arr[i] > first) {
            second = arr[i];
            secondAddress = i;
        }
    }
    let third = Number.MAX_VALUE;
    let thirdAddress = 0;
    for (let i = 0; i < arr_size; i++) {
        if (arr[i] < third && arr[i] > second) {
            third = arr[i];
            thirdAddress = i;
        }
    }
    let dataObject = [{ "value": first, "index": firstAddress }, { "value": second, "index": secondAddress }, { "value": third, "index": thirdAddress }]
    return dataObject
}



//generic function to get the last six complete dates

const getLastSixDates = () => {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let lastSixDates = [];
    let dayCopy = day;
    if (dayCopy > 6) {
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        for (let i = 0; i < 6; i++) {
            day = day - 1;
            day = day.toString();
            if (day.length === 1) {
                day = "0" + day;
            }
            lastSixDates[i] = `${day}-${month}-${year}`;
            day = parseInt(day);
        }
    }
    if (dayCopy <= 6) {
        let dayCopy = day;
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        let i;
        for (i = 0; i < dayCopy - 1; i++) {
            day = day - 1;
            day = day.toString();
            if (day.length === 1) {
                day = "0" + day;
            }
            lastSixDates[i] = `${day}-${month}-${year}`;
            day = parseInt(day);
        }
        month = parseInt(month);
        month = month - 1;
        if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
            day = 31;
        }
        if (month === 4 || month === 6 || month === 9 || month === 11) {
            day = 31;
        }
        if (month === 2) {
            day = 28;
        }
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        lastSixDates[i] = `${day}-${month}-${year}`;
        for (let j = i + 1; j < 6; j++) {
            day = day - 1;
            lastSixDates[j] = `${day}-${month}-${year}`;
        }
    }
    return lastSixDates
}


//generic function to convert full dates into words

const convertDatesIntoWords = (lastSixDates) => {
    let datesIntoWords = lastSixDates.map((item) => {
        let day = item.slice(0, 2);
        let month = item.slice(3, 5);
        switch (month) {
            case "01": return day + " Jan"
            case "02": return day + " Feb"
            case "03": return day + " Mar"
            case "04": return day + " Apr"
            case "05": return day + " May"
            case "06": return day + " Jun"
            case "07": return day + " Jul"
            case "08": return day + " Aug"
            case "09": return day + " Sep"
            case "10": return day + " Oct"
            case "11": return day + " Nov"
            case "12": return day + " Dec"
            default: return
        }
    })
    datesIntoWords[0] = "Yesterday";
    return datesIntoWords
}



//generic function to get the last 42 days dates

const getLast42Days = () => {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let last42Days = [];
    let i;
    const dayCopy = day;
    month = month.toString();
    if (month.length === 1) {
        month = "0" + month;
    }
    for (i = 0; i < dayCopy - 1; i++) {
        day = day - 1;
        day = day.toString();
        if (day.length === 1) {
            day = "0" + day;
        }
        last42Days[i] = `${day}-${month}`;
        day = parseInt(day);
    }
    month = parseInt(month);
    month = month - 1;
    if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
        day = 31;
    }
    if (month === 4 || month === 6 || month === 9 || month === 11) {
        day = 31;
    }
    if (month === 2) {
        day = 28;
    }
    month = month.toString();
    if (month.length === 1) {
        month = "0" + month;
    }
    let j;
    if (day + dayCopy - 1 >= 42) {
        last42Days[i] = `${day}-${month}`;
        for (j = i + 1; j < 42; j++) {
            day = day - 1;
            day = day.toString();
            if (day.length === 1) {
                day = "0" + day;
            }
            last42Days[j] = `${day}-${month}`;
            day = parseInt(day);
        }
    }
    if (day + dayCopy - 1 < 42) {
        const dayCopy2 = day;
        last42Days[i] = `${day}-${month}`;
        for (j = i + 1; j < dayCopy2 + i; j++) {
            day = day - 1;
            day = day.toString();
            if (day.length === 1) {
                day = "0" + day;
            }
            last42Days[j] = `${day}-${month}`;
            day = parseInt(day);
        }
        month = parseInt(month);
        month = month - 1;
        if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
            day = 31;
        }
        if (month === 4 || month === 6 || month === 9 || month === 11) {
            day = 31;
        }
        if (month === 2) {
            day = 28;
        }
        month = month.toString();
        if (month.length === 1) {
            month = "0" + month;
        }
        let remainingDays = 42 - dayCopy2 - dayCopy - 1;
        last42Days[j] = `${day}-${month}`;
        for (let k = j + 1; k < remainingDays + j; k++) {
            day = day - 1;
            day = day.toString();
            if (day.length === 1) {
                day = "0" + day;
            }
            last42Days[k] = `${day}-${month}`;
            day = parseInt(day);
        }
    }
    return last42Days
}


//generic function to get six weeks notations from 42 dates

const getLastSixWeeks = (last42Days) => {
    let last6Weeks = [];
    last6Weeks[0] = "This week";
    last6Weeks[1] = "Last week";
    last6Weeks[2] = "3rd week";
    last6Weeks[3] = "4th week";
    last6Weeks[4] = "5th week";
    last6Weeks[5] = "6th week";
    return last6Weeks
}


//generic function to get last six months

const getLastSixMonths = () => {
    let date = new Date();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    last6Months = [];
    if (month > 6) {
        for (let i = 0; i < 6; i++) {
            month = month.toString();
            if (month.length === 1) {
                month = "0" + month;
            }
            last6Months[i] = `${month}-${year}`
            month = parseInt(month);
            month = month - 1;
        }
    }
    if (month <= 6) {
        let i;
        let monthCopy = month;
        for (i = 0; i < monthCopy; i++) {
            month = month.toString();
            if (month.length === 1) {
                month = "0" + month;
            }
            last6Months[i] = `${month}-${year}`;
            month = parseInt(month);
            month = month - 1;
        }
        year = year - 1;
        month = 12;
        last6Months[i] = `${month}-${year}`;
        for (let j = i + 1; j < 6; j++) {
            month = month - 1;
            month = month.toString();
            if (month.length === 1) {
                month = "0" + month;
            }
            last6Months[j] = `${month}-${year}`;
            month = parseInt(month);
        }
    }
    return last6Months
}

module.exports = { createProduct, getProducts, updateProduct, deleteProduct, getAllProducts, thisWeekPerformance, acceptOrderVendor, acceptOrderUser, declineOrderVendor, declineOrderUser, setTimeVendor, setTimeUser, orderCompletedVendor, orderCompletedUser, getAllOrders, getAverageVisitors, getAverageVisitorsForSixWeeks, getAverageVisitorsForSixMonths, getRevenueFor6Days, getRevenueFor6Weeks, getRevenueFor6Months, getBestPerforming }