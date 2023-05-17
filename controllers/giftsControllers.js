const { StatusCodes } = require('http-status-codes');
const User = require('../models/user');
const Admin = require("../models/admin");
const Content = require("../models/content");
const Gifts = require("../models/gifts");
const Vendor = require("../models/vendor");


//Controller 1
const sendGift = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { id, text, productsAttached, productId, receiverId, anonymous, adminId, giftId } = req.body;
        const data = {
            uid: id,
            text: text,
            receiverId: receiverId,
            senderId: req.user.id,
            status: "vendor",
            code: null,
            locker: null,
            reaction: null,
            productsAttached: productsAttached,
            productId: productId,
            anonymous: anonymous,
            giftId: giftId,
            review: ""
        };
        User.findById((receiverId), (err, user) => {
            if (err) return console.error(err);
            let blockList = user.blockList;
            blockList.map((item) => {
                if (item === req.user.id) {
                    return res.status(StatusCodes.OK).send("You are blocked to send anything to this user.")
                }
            })
            user.giftsReceived.push(data);
            user.save((err, update) => {
                if (err) return console.error(err);
            })
        });
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            user.giftsSend.push(data);
            user.notifications.push({ key: "giftOrderConfirmation", value: "Your gift order has been successfully received. Keep tuned in for further updates.", data: id })
            user.save((err, update) => {
                if (err) return console.error(err);
            })
        });
        Admin.findById((adminId), (err, admin) => {
            if (err) return console.error(err);
            admin.gifts.push(data);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Gift order has been placed.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to send gifts.");
    }
}

//Controller 2
const setGiftInLocker = async (req, res) => {
    if (req.user.role === "admin") {
        const { senderId, receiverId, uid, locker, code } = req.body;
        User.findById((senderId), (err, user) => {
            if (err) return console.error(err);
            let giftsSend = user.giftsSend;
            giftsSend.map((item) => {
                if (item.uid === uid) {
                    item.status = "lockerPending";
                    item.code = code;
                    item.locker = locker;
                }
            })
            user.giftsSend = [];
            user.giftsSend.push(...giftsSend);
            user.notifications.push({ key: "giftOrderDisplayed", value: "Your ordered gift has been placed in locker and the receiver has been informed.", data: { lockerId: locker, code: code, uid: uid } })
            user.save();
        });
        let anonymous;
        User.findById((receiverId), (err, user) => {
            if (err) return console.error(err);
            const giftsReceived = user.giftsReceived;
            giftsReceived.map((item) => {
                if (item.uid === uid) {
                    item.status = "lockerPending";
                    item.code = code;
                    item.locker = locker;
                    anonymous = item.anonymous;
                }
            })
            user.giftsReceived = [];
            user.giftsReceived.push(...giftsReceived);
            if (anonymous) {
                user.notifications.push({ key: "giftReceivedAnonymous", value: "We have got something for you.Do you want to receive?", data: { lockerId: locker, code: code, uid: uid } })
            }
            else {
                user.notifications.push({ key: "giftReceived", value: "We have got something for you.Do you want to receive?", data: { lockerId: locker, code: code, uid: uid } })
            }
            user.save();
        });
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err);
            const gifts = admin.gifts;
            gifts.map((item) => {
                if (item.uid === uid) {
                    item.status = "lockerPending";
                    item.code = code;
                    item.locker = locker;
                }
            })
            admin.gifts = [];
            admin.gifts.push(...gifts);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Gift has been set in the locker.")
            });
        });
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to allocate lockers to the gifts.");
    }
}

//Controller 3
const acceptOrDecline = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { uid, senderId, adminId, status } = req.body;
        User.findById((senderId), (err, user) => {
            if (err) return console.error(err);
            let giftsSend = user.giftsSend;
            giftsSend.map((item) => {
                if (item.uid === uid) {
                    item.status = status;
                }
            })
            user.giftsSend = [];
            user.giftsSend.push(...giftsSend);
            user.notifications.push({ key: "acceptedOrDeclined", value: "The receiver has decided something.", data: { status: status, uid: uid } })
            user.save();
        });
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            const giftsReceived = user.giftsReceived;
            giftsReceived.map((item) => {
                if (item.uid === uid) {
                    item.status = status;
                }
            })
            user.giftsReceived = [];
            user.giftsReceived.push(...giftsReceived);
            user.notifications.push({ key: "acceptedOrDeclined", value: "You have made a decision.", data: { status: status, uid: uid } })
            user.save();
        });
        Admin.findById((adminId), (err, admin) => {
            if (err) return console.error(err);
            const gifts = admin.gifts;
            gifts.map((item) => {
                if (item.uid === uid) {
                    item.status = status;
                }
            })
            admin.gifts = [];
            admin.gifts.push(...gifts);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Your response has been noted.")
            });
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to accept or decline gifts.");
    }
}

//Controller 4
const dispatch = async (req, res) => {
    if (req.user.role === "admin") {
        const { code, locker } = req.body;
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err);
            let matchedGift;
            let gifts = admin.gifts;
            gifts.map((item) => {
                if (item.code === code && item.locker === locker) {
                    matchedGift = item;
                    item.status = "dispatched";
                }
            });
            if (matchedGift) {
                const senderId = matchedGift.senderId;
                const receiverId = matchedGift.receiverId;
                const uid = matchedGift.uid;
                User.findById((receiverId), (err, user) => {
                    if (err) return console.error(err);
                    const giftsReceived = user.giftsReceived;
                    giftsReceived.map((item) => {
                        if (item.uid === uid) {
                            item.status = "dispatched";
                        }
                    })
                    user.giftsReceived = [];
                    user.giftsReceived.push(...giftsReceived);
                    user.notifications.push({ key: "gotIt", value: "You have taken your gift from the locker.", data: { uid: uid } })
                    user.save();
                });
                User.findById((senderId), (err, user) => {
                    if (err) return console.error(err);
                    let giftsSend = user.giftsSend;
                    giftsSend.map((item) => {
                        if (item.uid === uid) {
                            item.status = "dispatched";
                        }
                    })
                    user.giftsSend = [];
                    user.giftsSend.push(...giftsSend);
                    user.notifications.push({ key: "deliveredIt", value: "We have finally delivered your gift.Keep tuned in for the reaction.", data: { uid: uid } })
                    user.save();
                });
                admin.gifts = [];
                admin.gifts.push(...gifts);
                admin.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("The gift has been successfully dispatched.")
                });
            }
            else {
                return res.status(StatusCodes.OK).send("Code does not match!");
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to dispatch the gifts.");
    }
}

//Controller 5
const reaction = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { videoUrl, senderId, adminId, uid } = req.body;
        const content = await Content.create({ contentType: "video", sendBy: "userGift", idOfSender: req.user.id, url: videoUrl });
        User.findById((senderId), (err, user) => {
            if (err) return console.error(err);
            let giftsSend = user.giftsSend;
            giftsSend.map((item) => {
                if (item.uid === uid) {
                    item.status = "reacted";
                    item.reaction = content._id;
                }
            })
            user.giftsSend = [];
            user.giftsSend.push(...giftsSend);
            user.notifications.push({ key: "reaction", value: "The receiver has reacted to your gift.Click here to watch.", data: { uid: uid, videoUrl: videoUrl } })
            user.save();
        });
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            const giftsReceived = user.giftsReceived;
            giftsReceived.map((item) => {
                if (item.uid === uid) {
                    item.status = "reacted";
                    item.reaction = content._id;
                }
            })
            user.giftsReceived = [];
            user.giftsReceived.push(...giftsReceived);
            user.notifications.push({ key: "reaction", value: "You have reacted to the gift.", data: { uid: uid, videoUrl: videoUrl } })
            user.save();
        });
        Admin.findById((adminId), (err, admin) => {
            if (err) return console.error(err);
            const gifts = admin.gifts;
            gifts.map((item) => {
                if (item.uid === uid) {
                    item.status = "reacted";
                    item.reaction = content._id;
                }
            })
            admin.gifts = [];
            admin.gifts.push(...gifts);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Your reaction has been saved.");
            });
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to submit the reaction.");
    }
}

//Controller 6
const createGift = async (req, res) => {
    if (req.user.role === "admin") {
        const gift = await Gifts.create({ ...req.body });
        if (gift) return res.status(StatusCodes.OK).json(gift);
        else return res.status(StatusCodes.OK).send("Could not create gift.Try again.")
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to create gift.")
    }
}

//Controller 7
const updateGift = async (req, res) => {
    if (req.user.role === "admin") {
        const { giftId, data } = req.body;
        const updatedGift = await Gifts.findByIdAndUpdate({ _id: giftId }, { ...data }, { new: true, runValidators: true });
        if (updatedGift) return res.status(StatusCodes.OK).send("The gift was successfully updated.");
        else return res.status(StatusCodes.OK).send("Couldn't update the gift.Try again.");
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to update the gift.");
    }
}

//Controller 8
const deleteGift = async (req, res) => {
    if (req.user.role === "admin") {
        const { giftId } = req.body;
        const deletedGift = await Gifts.findByIdAndDelete({ _id: giftId });
        if (deletedGift) return res.status(StatusCodes.OK).send("The gift was successfully deleted.");
        else return res.status(StatusCodes.OK).send("Couldn't delete the gift.Try again.");
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete the gift.");
    }
}

//Controller 9
const getGifts = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const gifts = await Gifts.find({});
        return res.status(StatusCodes.OK).json(gifts);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the gifts.");
    }
}

//Controller 10
const getVendorGifts = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const vendor = await Vendor.find({ type: "gift" });
        let vendorGifts = [];
        vendor.map((item) => {
            vendorGifts.push(item.productsOwned);
        })
        return res.status(StatusCodes.OK).json(vendorGifts);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the vendor gifts.");
    }
}

//Controller 11
const getReactions = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const content = await Content.find({ sendBy: "userGift" });
        return res.status(StatusCodes.OK).json(content);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the reactions.")

    }
}


//Controller 12
const getOrdersAdmin = async (req, res) => {
    if (req.user.role === "admin") {
        const admin = await Admin.findById(req.user.id);
        console.log(admin);
        if (!admin) return res.status(StatusCodes.OK).send("No such admin found.");
        let orders = admin.gifts;
        return res.status(StatusCodes.OK).json(orders);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read admin gifts orders.")
    }
}

//Controller 13
const getGiftFromId = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { id } = req.body;
        const gift = await Gifts.findById(id);
        return res.status(StatusCodes.OK).json(gift);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the gifts.")
    }
}

//Controller 14
const review = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { senderId, review, uid, adminId } = req.body;
        if (review === "block") {
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                user.blockList.push(senderId);
                let giftsReceived = user.giftsReceived;
                giftsReceived.map((item) => {
                    if (item.uid === uid) {
                        item.review = review;
                    }
                })
                user.giftsReceived = [];
                user.giftsReceived.push(...giftsReceived);
                user.notifications.push({ key: "block", value: "You have blocked the sender.", data: { uid: uid } })
                user.save();
            })
        }
        else {
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let giftsReceived = user.giftsReceived;
                giftsReceived.map((item) => {
                    if (item.uid === uid) {
                        item.review = review;
                    }
                })
                user.giftsReceived = [];
                user.giftsReceived.push(...giftsReceived);
                user.notifications.push({ key: "reviewed", value: "You have reviewed the gift send to you.", data: { uid: uid } })
                user.save();
            })
        }
        User.findById((senderId), (err, user) => {
            if (err) return console.error(err);
            let giftsSend = user.giftsSend;
            giftsSend.map((item) => {
                if (item.uid === uid) {
                    item.review = review;
                }
            })
            user.giftsSend = [];
            user.giftsSend.push(...giftsSend);
            user.notifications.push({ key: "reviewed", value: "The receiver has reviewed your gift.", data: { uid: uid } })
            user.save();
        });
        Admin.findById((adminId), (err, admin) => {
            if (err) return console.error(err);
            const gifts = admin.gifts;
            gifts.map((item) => {
                if (item.uid === uid) {
                    item.review = review;
                }
            })
            admin.gifts = [];
            admin.gifts.push(...gifts);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The gift has been successfully reviewed.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to review the gift.")
    }
}


//Controller 15
const unblock = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { id } = req.body;
        User.findById((id), (err, user) => {
            if (err) return console.error(err);
            user.notifications.push({ key: "unblocked", value: "You have been unblocked.", data: { id: req.user.id } });
            user.save();
        })
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            let blockList = user.blockList;
            blockList = blockList.filter((item) => item !== id)
            user.blockList = [];
            user.blockList.push(...blockList);
            user.save((err, update) => {
                if (err) return console.error(err)
                return res.status(StatusCodes.OK).send("The user has been successfully unblocked.")
            })
        })
    }
}

//Controller 16
const getBlockList = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            let blockList = user.blockList;
            return res.status(StatusCodes.OK).json(blockList);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read the blockList.")
    }
}

module.exports = { sendGift, setGiftInLocker, acceptOrDecline, dispatch, reaction, createGift, updateGift, deleteGift, getGifts, getVendorGifts, getReactions, getOrdersAdmin, getGiftFromId, review, getBlockList, unblock };