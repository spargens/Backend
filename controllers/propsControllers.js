const { StatusCodes } = require('http-status-codes');
const Props = require('../models/props');
const User = require('../models/user');

//Controller 1
const registerProp = async (req, res) => {
    if (req.user.role === "admin") {
        const { id, name } = req.body;
        const existingProp = await Props.findOne({ id: id });
        if (existingProp) return res.status(StatusCodes.OK).send("A prop with same id already exists.");
        if (name === "Projector" || name === "Board" || name === "Chess" || name === "Sound-Box") {
            const prop = await Props.create({ ...req.body });
            return res.status(StatusCodes.OK).send("Prop was successfully created!")
        }
        else {
            return res.status(StatusCodes.OK).send("Invalid prop name.Available options:Projector,Board,Chess,Sound - Box")
        }
    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to register a new prop.')
    }
}

//Controller 2
const deleteProp = async (req, res) => {
    if (req.user.role === "admin") {
        const { id } = req.body;
        const prop = await Props.findOneAndRemove({ id: id });
        if (prop) {
            return res.status(StatusCodes.OK).json("Prop was successfully deleted.");
        }
        return res.status(StatusCodes.OK).send("Was unable to find prop and delete it.");
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to decommission a prop.");
    }
}

//Controller 3
const findAvailableProp = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { prop, day, slotIndex } = req.body;
        const user = await User.findById(req.user.id);
        console.log(user.credibilityScore);
        if (user.credibilityScore < 2) {
            return res.status(StatusCodes.OK).send("Not enough credit score.")
        }
        const props = await Props.find({ name: prop, available: true });
        let propList = [];
        let propIds = [];
        //this loop goes through all available props and classify them as risky or not risky
        for (let i = 0; i < props.length; i++) {
            let risky = false;
            let item = props[i];
            dayArr = item[day];
            for (j = 0; j < slotIndex.length; j++) {
                if (dayArr[slotIndex[j]].booked === true) {
                    break;
                }
                if (slotIndex[0] !== 0) {
                    if (dayArr[slotIndex[0] - 1].booked === true) {
                        risky = true;
                    }
                }
                else {
                    if (item.morningReturn) {
                        risky = true;
                    }
                }
            }
            if (j === slotIndex.length) {
                propIds = [{ risky: risky, id: item.id }, ...propIds];
            }
        }
        if (propIds.length === 0) {
            return res.status(StatusCodes.OK).send("All props are currently booked.Try after some time.");
        }
        //this loop picks up one non-risky prop from an array of available options
        let propId = propIds[0].id;
        let len = propIds.length;
        for (let k = 0; k < len; k++) {
            if (!propIds[k].risky) {
                propId = propIds[k].id;
                break;
            }
        }
        //this code temporary marks the selected prop as booked to prevent contingencies
        Props.findOne({ id: propId }, (err, prop) => {
            if (err) console.error(err);
            for (let k = 0; k < slotIndex.length; k++) {
                let data;
                if (k === slotIndex.length - 1) {
                    data = { id: req.user.id, booked: true, break: null };
                }
                else {
                    data = { id: req.user.id, booked: true, break: null };
                }
                prop[day][slotIndex[k]] = data;
            }
            prop.save((err, update) => {
                if (err) return console.log(err);
                return res.status(StatusCodes.OK).json({ Msg: "Prop is available.", propId: propId });
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the props availability.")
    }
}

//Controller 4
const placeOrder = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { paymentSuccessful, propId, prop, day, slotIndex } = req.body;
        if (paymentSuccessful === true) {
            let otp = Math.floor(1000 + Math.random() * 9000);
            Props.findOne({ id: propId }, (err, prop) => {
                if (err) console.error(err);
                for (let k = 0; k < slotIndex.length; k++) {
                    let data;
                    if (k === slotIndex.length - 1) {
                        data = { id: req.user.id, booked: true, break: otp };
                    }
                    else {
                        data = { id: req.user.id, booked: true, break: null };
                    }
                    prop[day][slotIndex[k]] = data;
                }
                prop.save((err, update) => {
                    if (err) return console.log(err);
                })
            });
            const startIndex = ["9am", "10am", "11am", "12noon", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"];
            const lastIndex = ["10am", "11am", "12noon", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm"];
            const date = new Date();
            const l = slotIndex.length;
            const bookedTime = `${startIndex[slotIndex[0]]} to ${lastIndex[slotIndex[l - 1]]}`;
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                user.propOrder.push({ id: propId, otp: otp, name: prop, time: bookedTime, status: "Yet to be dispatched", remark: null, logId: null, date: date, reviewed: false });
                user.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).json({ bookedProp: propId, otp: otp });
                })
            })
        }
        else {
            let prop = await Props.findOne({ id: propId });
            let arr;
            switch (day) {
                case "today":
                    arr = prop.today;
                    break;
                case "tomorrow":
                    arr = prop.tomorrow;
                    break;
                case "thirdDay":
                    arr = prop.thirdDay;
                    break;
                default:
                    break;
            }
            let newArr = [];
            let len = slotIndex.length;
            arr.map((item, index) => {
                for (let k = 0; k < len; k++) {
                    if (index === slotIndex[k]) {
                        newArr = [...newArr, { id: null, booked: false, break: null }];
                    }
                    else {
                        newArr = [...newArr, item];
                    }
                }
            });
            Props.findOne({ id: propId }, (err, prop) => {
                if (err) return console.error(err);
                switch (day) {
                    case "today":
                        prop.today = newArr;
                        break;
                    case "tomorrow":
                        prop.tomorrow = newArr;
                        break;
                    case "thirdDay":
                        prop.thirdDay = newArr;
                        break;
                    default:
                        break;
                }
                prop.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Try again.Normal state has been restored.")
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to order the props.")
    }
}

//Controller 5
const dispatchProp = async (req, res) => {
    if (req.user.role === "admin") {
        const { propId, day, otp } = req.body;
        let currentTime = new Date();
        const date = currentTime.getDate();
        const month = currentTime.getMonth() + 1;
        const year = currentTime.getFullYear();
        const dispatchTimeArray = [
            new Date(`${month}-${date}-${year} 9:00`),
            new Date(`${month}-${date}-${year} 10:00`),
            new Date(`${month}-${date}-${year} 11:00`),
            new Date(`${month}-${date}-${year} 12:00`),
            new Date(`${month}-${date}-${year} 13:00`),
            new Date(`${month}-${date}-${year} 14:00`),
            new Date(`${month}-${date}-${year} 15:00`),
            new Date(`${month}-${date}-${year} 16:00`),
            new Date(`${month}-${date}-${year} 17:00`),
            new Date(`${month}-${date}-${year} 18:00`)
        ];
        let userId;
        if (day === true) {
            Props.findOne({ id: propId }, (err, item) => {
                if (!item) return res.status(StatusCodes.OK).send("Prop id is invalid.");
                if (item.available === false) return res.status(StatusCodes.OK).send("Prop is currently decommissioned.");
                if (item.dispatched === true) return res.status(StatusCodes.OK).send("This prop is already on field.We are waiting for its return.");
                const todaySlot = item.today;
                let otpMatched = false;
                let timeIsFine = false;
                for (let i = 0; i < 10; i++) {
                    //if you send an empty otp this condition will be matched,so be aware
                    if (todaySlot[i].break === otp) {
                        userId = todaySlot[i].id;
                        otpMatched = true;
                        let dispatchTime = dispatchTimeArray[i];
                        if (currentTime - dispatchTime > 0) {
                            timeIsFine = true;
                        }
                        break;
                    }
                }
                if (otpMatched && timeIsFine) {
                    item.dispatched = true;
                    item.dispatchTime = new Date();
                    item.save((err, update) => {
                        if (err) return console.error(err)
                        User.findById((userId), (err, user) => {
                            if (err) console.error(err);
                            let propOrders = user.propOrder;
                            propOrders.map((item, index) => {
                                if (item.otp === otp) {
                                    item.status = "Dispatched";
                                }
                            });
                            user.propOrder = [];
                            user.propOrder.push(...propOrders);
                            user.save((err, update) => {
                                if (err) return console.error(err);
                                return res.status(StatusCodes.OK).send("Prop has been successfully dispatched.");
                            })
                        })
                    })
                }
                else if (!otpMatched) {
                    return res.status(StatusCodes.OK).send("No prop with this OTP is authorized to be dispatched now.");
                }
                else {
                    return res.status(StatusCodes.OK).send("It is too early to dispatch.")
                }

            })
        }
        if (day === false) {
            const today = new Date();
            let tomorrow = new Date(`${today.getFullYear()},${today.getMonth()},${today.getDate() + 1} 09:00:00.000`);
            let otpVerified = false;
            const prop = await Props.findOne({ id: propId });
            if (!prop) return res.status(StatusCodes.OK).send("Prop id is invalid.");
            if (prop.available === false) return res.status(StatusCodes.OK).send("Prop is currently decommissioned.");
            if (prop.dispatched === true) return res.status(StatusCodes.OK).send("This prop is already on field.We are waiting for its return.");
            const actualOtp = prop.nightBookingData1.otp;
            userId = prop.nightBookingData1.id;
            if (actualOtp === otp) otpVerified = true;
            if (actualOtp !== otp) return res.status(StatusCodes.OK).send("No prop with this OTP is authorized to be dispatched now.");
            if (otpVerified) {
                Props.findOne({ id: propId }, (err, item) => {
                    item.dispatched = true;
                    item.dispatchTime = new Date();
                    item.morningReturn = { userId: userId, otp: otp }
                    item.save((err, update) => {
                        if (err) console.error(err);
                        User.findById((userId), (err, user) => {
                            if (err) console.error(err);
                            let propOrders = user.propOrder;
                            propOrders.map((item, index) => {
                                if (item.otp === otp) {
                                    item.status = "Dispatched";
                                }
                            });
                            user.propOrder = [];
                            user.propOrder.push(...propOrders);
                            user.save((err, update) => {
                                if (err) return console.error(err);
                                return res.status(StatusCodes.OK).send("Prop has been successfully dispatched.");
                            })
                        })
                    })
                });
            }
        }


    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to dispatch props.');
    }
}

//Controller 6
const returnProps = async (req, res) => {
    if (req.user.role === "admin") {
        const { id, adminRating, adminRemark, logId, day, otp } = req.body;
        const prop = await Props.findOne({ id: id });
        if (!prop) {
            return res.status(StatusCodes.OK).send("Prop with entered id does not exist.");
        }
        if (prop.available === false) {
            return res.status(StatusCodes.OK).send("The prop is currently decommissioned.");
        }
        if (!prop.dispatched) {
            return res.status(StatusCodes.OK).send("The prop is already submitted.");
        }
        let userId;
        if (day) {
            let bookingSlots = [];
            const todaySlot = prop.today;
            for (let i = 0; i < 10; i++) {
                if (todaySlot[i].booked) {
                    bookingSlots = [i, ...bookingSlots];
                    if (todaySlot[i].break && todaySlot[i].break !== otp) {
                        bookingSlots = [];
                    }
                    if (todaySlot[i].break === otp) {
                        break;
                    }
                }
            }
            if (bookingSlots.length === 0) return res.status(StatusCodes.OK).send("OTP is wrong");
            userId = todaySlot[bookingSlots[0]].id;
            let logData = { logId, adminRating, adminRemark, userId, userReview: null };
            Props.findOne({ id: id }, (err, item) => {
                if (err) return console.error(err);
                item.dispatched = false;
                item.dispatchTime = null;
                item.past = [logData, ...item.past];
                item.save((err, update) => {
                    if (err) return console.error(err);
                    User.findById(userId, (err, user) => {
                        if (err) return console.error(err);
                        let score = user.credibilityScore;
                        let newScore = Number(adminRating);
                        score = (score + newScore) / user.propOrder.length;
                        user.credibilityScore = score;
                        let propOrders = user.propOrder;
                        propOrders.map((item, index) => {
                            if (item.otp === otp) {
                                item.status = "Received";
                                item.remark = null;
                                item.logId = logId;
                            }
                        });
                        user.propOrder = [];
                        user.propOrder.push(...propOrders);
                        const newArr = user.propOrder.filter((item) => item !== otp);
                        user.propOrder = newArr;
                        user.save((err, update) => {
                            if (err) return console.error(err);
                            return res.status(StatusCodes.OK).send("Prop was successfully submitted.");
                        })
                    })
                })
            })
        }
        if (!day) {
            userId = prop.morningReturn.userId;
            let logData = { logId, adminRating, adminRemark, userId, userReview: null };
            if (prop.morningReturn.otp !== otp) return res.status(StatusCodes.OK).send("OTP is wrong");
            Props.findOne({ id: id }, (err, item) => {
                if (err) return console.error(err);
                item.dispatched = false;
                item.dispatchTime = null;
                item.morningReturn = null;
                item.nightBookingStatus1 = false;
                item.nightBookingData1 = { id: null, otp: null };
                item.past = [logData, ...item.past];
                item.save((err, update) => {
                    if (err) return console.error(err);
                    User.findById(userId, (err, user) => {
                        if (err) return console.error(err);
                        let score = user.credibilityScore;
                        let newScore = Number(adminRating);
                        score = (score + newScore) / 2;
                        user.credibilityScore = score;
                        let propOrders = user.propOrder;
                        propOrders.map((item, index) => {
                            if (item.otp === otp) {
                                item.status = "Received";
                                item.remark = null;
                                item.logId = logId;
                            }
                        });
                        user.propOrder = [];
                        user.propOrder.push(...propOrders);
                        const newArr = user.propOrder.filter((item) => item !== otp);
                        user.propOrder = newArr;
                        user.save((err, update) => {
                            if (err) return console.error(err);
                            return res.status(StatusCodes.OK).send("Prop was successfully submitted.");
                        })
                    })
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to make submission of props.')
    }
}

//Controller 7
const userPropReview = async (req, res) => {
    if (req.user.role === "user") {
        const { id, logId, msg } = req.body;
        const userId = req.user.id;
        Props.findOne({ id: id }, (err, prop) => {
            if (err) return console.error(err);
            let logBook = prop.past;
            logBook.map((item, index) => {
                if (item.logId === logId) {
                    item.userReview = msg;
                }
            });
            prop.past = [];
            prop.past.push(...logBook);
            prop.save((err, update) => {
                if (err) return console.error(err);
            })
        })
        User.findById((userId), (err, user) => {
            if (err) return console.error(err);
            let propOrders = user.propOrder;
            propOrders.map((item, index) => {
                if (item.logId === logId) {
                    item.remark = msg;
                }
            });
            user.propOrder = [];
            user.propOrder.push(...propOrders);
            user.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Thank you for your review.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to review this prop.");
    }
}

//Controller 8
const getPropOrder = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        let userId = req.user.id;
        let user = await User.findById({ _id: userId });
        if (!user) return res.status(StatusCodes.OK).send("Could not find the user.Please try again.");
        let propOrder = user.propOrder;
        return res.status(StatusCodes.OK).json({ propOrder: propOrder });
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to to access user's prop history.")
    }
}

//Controller 9
const nightBookingAvailability = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { prop, date } = req.body;
        let propId;
        if (date === "today") {
            const propAvail = await Props.findOne({ available: true, nightBookingStatus1: false, name: prop });
            if (!propAvail) return res.status(StatusCodes.OK).send(`Every ${prop} is already booked for today night.`);
            propId = propAvail.id;
            Props.findOne({ id: propId }, (err, item) => {
                if (err) console.error(err);
                item.nightBookingStatus1 = true;
                item.nightBookingData1 = { id: req.user.id, otp: null };
                item.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).json({ Msg: "Prop is available.", propId: propId });
                })
            })
        }
        if (date === "tomorrow") {
            const propAvail = await Props.findOne({ available: true, nightBookingStatus2: false, name: prop });
            if (!propAvail) return res.status(StatusCodes.OK).send(`Every ${prop} is already booked for tomorrow night.`);
            propId = propAvail.id;
            Props.findOne({ id: propId }, (err, item) => {
                if (err) console.error(err);
                item.nightBookingStatus2 = true;
                item.nightBookingData2 = { id: req.user.id, otp: null };
                item.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).json({ Msg: "Prop is available.", propId: propId });
                })
            })
        }
        if (date === "thirdDay") {
            const propAvail = await Props.findOne({ available: true, nightBookingStatus3: false, name: prop });
            if (!propAvail) return res.status(StatusCodes.OK).send(`Every ${prop} is already booked for third night.`);
            propId = propAvail.id;
            Props.findOne({ id: propId }, (err, item) => {
                if (err) console.error(err);
                item.nightBookingStatus3 = true;
                item.nightBookingData3 = { id: req.user.id, otp: null };
                item.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).json({ Msg: "Prop is available.", propId: propId });
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to check the night booking availability of props.")
    }
}

//Controller 10
const placeNightOrder = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { paymentSuccessful, propId, prop, day } = req.body;
        if (paymentSuccessful === true) {
            let otp = Math.floor(1000 + Math.random() * 9000);
            Props.findOne({ id: propId }, (err, prop) => {
                if (err) return console.error(err);
                switch (day) {
                    case "today":
                        prop.nightBookingStatus1 = true;
                        prop.nightBookingData1 = { id: req.user.id, otp: otp };
                        break;
                    case "tomorrow":
                        prop.nightBookingStatus2 = true;
                        prop.nightBookingData2 = { id: req.user.id, otp: otp };
                        break;
                    case "thirdDay":
                        prop.nightBookingStatus3 = true;
                        prop.nightBookingData3 = { id: req.user.id, otp: otp };
                    default:
                        break;
                }
                prop.save((err, update) => {
                    if (err) return console.error(err);
                })
            })
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                user.propOrder.push({ id: propId, otp: otp, name: prop, time: "Night Shift", status: "Yet to be dispatched" });
                user.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).json({ bookedProp: propId, otp: otp });
                })
            })
        }
        else {
            Props.findOne({ id: propId }, (err, prop) => {
                if (err) return console.error(err);
                switch (day) {
                    case "today":
                        prop.nightBookingStatus1 = false;
                        prop.nightBookingData1 = { id: null, otp: null };
                        break;
                    case "tomorrow":
                        prop.nightBookingStatus2 = false;
                        prop.nightBookingData2 = { id: null, otp: null };
                        break;
                    case "thirdDay":
                        prop.nightBookingStatus3 = false;
                        prop.nightBookingData3 = { id: null, otp: null };
                    default:
                        break;
                }
                prop.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Try again.Normal state has been restored.")
                })
            });

        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to place night orders for the props.");
    }
}

//Controller 11
const decommissionProp = async (req, res) => {
    if (req.user.role === "admin") {
        const { id, reason } = req.body;
        const prop = await Props.findOne({ id: id });
        if (!prop) {
            return res.status(StatusCodes.OK).send("Prop was not found.");
        }
        if (prop) {
            Props.findOne({ id: id }, (err, prop) => {
                console.log("entered");
                console.log(prop);
                console.log("err", err);
                if (err) return console.error(err);
                prop.available = false;
                prop.decommissionReason = reason;
                prop.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("The prop was successfully decommissioned.");
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to decommission a prop.')
    }
}

//Controller 12
const recommissionProp = async (req, res) => {
    if (req.user.role === "admin") {
        const { propId } = req.body;
        Props.findOne({ id: propId }, (err, item) => {
            if (err) return console.error(err);
            if (!item) return res.status(StatusCodes.OK).send("Prop of given id does not exists.");
            if (item.available === true) return res.status(StatusCodes.OK).send("Prop is already available.");
            item.available = true;
            item.decommissionReason = null;
            item.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Prop has been recommissioned.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to recommission a prop.');
    }
}

//Controller 13
const shiftArray = async (req, res) => {
    if (req.user.role === "admin") {
        const props = await Props.find({ available: true });
        props.map((item, index) => {
            //shifting day booking arrays
            let tomorrowDayBooking = item.tomorrow;
            let thirdDayBooking = item.thirdDay;
            item.today = [];
            item.today.push(...tomorrowDayBooking);
            item.tomorrow = [];
            item.tomorrow.push(...thirdDayBooking);
            item.thirdDay = [];
            let newArr = [
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null },
                { id: null, booked: false, break: null }];
            item.thirdDay.push(...newArr);
            //shifting night booking arrays
            let tomorrowNightBookingStatus = item.nightBookingStatus2;
            let tomorrowNightBookingData = item.nightBookingData2;
            let thirdDayNightBookingStatus = item.nightBookingStatus3;
            let thirdDayNightBookingData = item.nightBookingData3;
            item.nightBookingStatus1 = tomorrowNightBookingStatus;
            item.nightBookingData1 = tomorrowNightBookingData;
            item.nightBookingStatus2 = thirdDayNightBookingStatus;
            item.nightBookingData2 = thirdDayNightBookingData;
            item.nightBookingStatus3 = false;
            item.nightBookingData3 = { id: null, otp: null };

            item.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Booking arrays have been successfully renewed.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to shift the props array.");
    }
}


//Controller 14
const getPropsOnField = async (req, res) => {
    if (req.user.role === "admin") {
        const props = await Props.find({ dispatched: true });
        return res.status(StatusCodes.OK).json(props);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the status of props.");
    }
}


//Controller 15
const pumpUpCreditScore = async (req, res) => {
    if (req.user.role === "user") {
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            user.credibilityScore = user.credibilityScore + 1;
            user.save((err, update) => {
                if (err) return console.error(err)
                return res.status(StatusCodes.OK).send("Credit score has been pumped up by 1.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You don't have credit score.")
    }
}


//Controller 16
const timeOfReturn = async (req, res) => {
    if (req.user.role === "admin") {
        const { propId, otp } = req.body;
        let prop = await Props.find({ id: propId });
        prop = prop[0];
        const startIndex = ["9am", "10am", "11am", "12noon", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"];
        const lastIndex = ["10am", "11am", "12noon", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm"];
        let today = prop.today;
        for (let i = 0; i < 10; i++) {
            let booking = today[i].break;
            if (booking === otp) {
                let time = startIndex[i] + "  to  " + lastIndex[i];
                return res.status(StatusCodes.OK).send(time);
            }
        }
        return res.status(StatusCodes.OK).send("Could not find the return slot.")
    }
}


//Controller 17
const getStats = async (req, res) => {
    if (req.user.role === "admin") {
        const { propName } = req.body;
        const props = await Props.find({ name: propName });
        console.log(props);
        let len = props.length;
        let available = 0;
        for (let i = 0; i < len; i++) {
            if (!props[i].dispatched) available++;
        }
        return res.status(StatusCodes.OK).json({ total: len, available })
    }
}


//Controller 18
const getCreditScore = async (req, res) => {
    if (req.user.role === "user") {
        const user = await User.findById(req.user.id);
        const score = user.credibilityScore;
        return res.status(StatusCodes.OK).json(score)
    }
}


//controller to get the decommissioned props
//req configuration:
//authorization token in req header
//still unused

const decommissionedProps = async (req, res) => {
    if (req.user.role === "admin") {
        let decommissionedProps = 0;
        const props = await Props.find({ available: false });
        decommissionedProps = props.length;
        return res.status(StatusCodes.OK).json({ number: decommissionedProps, props });
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to know decommissioned props.');
    }
}


//controller to find the props whose return are delayed
//req configuration:
//authorization token in req header
//still unused

const delayedProps = async (req, res) => {
    if (req.user.role === "admin") {
        let delayedProps = [];
        const currentTime = new Date();
        const date = currentTime.getDate();
        const month = currentTime.getMonth() + 1;
        const year = currentTime.getFullYear();
        const deadLineArray = [
            new Date(`${month}-${date}-${year} 10:00`),
            new Date(`${month}-${date}-${year} 11:00`),
            new Date(`${month}-${date}-${year} 12:00`),
            new Date(`${month}-${date}-${year} 13:00`),
            new Date(`${month}-${date}-${year} 14:00`),
            new Date(`${month}-${date}-${year} 15:00`),
            new Date(`${month}-${date}-${year} 16:00`),
            new Date(`${month}-${date}-${year} 17:00`),
            new Date(`${month}-${date}-${year} 18:00`),
            new Date(`${month}-${date}-${year} 19:00`)
        ];
        const props = await Props.find({ available: true });
        let number = 0;
        props.map((prop, index) => {
            if (currentTime - prop.morningReturn.time > 0) {
                console.log(currentTime - prop.morningReturn.time);
                delayedProps = [...delayedProps, prop];
            }
            let todaySlot = prop.today;
            for (let i = 0; i < 10; i++) {
                if (todaySlot[i].break) {
                    let deadLine = deadLineArray[i];
                    if (currentTime - deadLine > 0) {
                        delayedProps = [...delayedProps, prop];
                        break;
                    }
                }
            }
        });
        return res.status(StatusCodes.OK).json({ delayedProps: delayedProps, number: number });
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to know the status of props.')
    }
}


//controller to get the statistics of the props
//req configuration:
//authorization token in req header
//still unused

const propsStatistics = async (req, res) => {
    if (req.user.role === "admin") {
        let projectorInUse = 0, projectorAvailable = 0, projectorDispatch = 0;
        let boardInUse = 0, boardAvailable = 0, boardDispatch = 0;
        let chessInUse = 0, chessAvailable = 0, chessDispatch = 0;
        let soundInUse = 0, soundAvailable = 0, soundDispatch = 0;
        const props = await Props.find({ available: true });
        props.map((item, index) => {
            if (item.name === "Projector") {
                if (item.booked === true && item.dispatched === true) projectorInUse++;
                else if (item.booked === true && !item.dispatched === true) projectorDispatch++;
                else projectorAvailable++;
            }
            if (item.name === "Board") {
                if (item.booked === true && item.dispatched === true) boardInUse++;
                else if (item.booked === true && !item.dispatched === true) boardDispatch++;
                else boardAvailable++;
            };
            if (item.name === "Chess") {
                if (item.booked === true && item.dispatched === true) chessInUse++;
                else if (item.booked === true && !item.dispatched === true) chessDispatch++;
                else chessAvailable++;
            }
            if (item.name === "Sound-Box") {
                if (item.booked === true && item.dispatched === true) soundInUse++;
                else if (item.booked === true && !item.dispatched === true) soundDispatch++;
                else soundAvailable++;
            }
        })
        return res.status(StatusCodes.OK).json({
            projectorInUse, projectorAvailable, projectorDispatch, boardInUse, boardAvailable, boardDispatch,
            chessInUse, chessAvailable, chessDispatch, soundInUse, soundAvailable, soundDispatch
        });
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to dispatch props.');
    }
}


module.exports = { registerProp, deleteProp, delayedProps, returnProps, decommissionProp, propsStatistics, decommissionedProps, recommissionProp, dispatchProp, userPropReview, shiftArray, findAvailableProp, placeOrder, getPropOrder, nightBookingAvailability, placeNightOrder, getPropsOnField, pumpUpCreditScore, timeOfReturn, getStats, getCreditScore };