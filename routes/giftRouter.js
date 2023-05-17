const express = require('express');
const router = express.Router();

const { sendGift, setGiftInLocker, acceptOrDecline, dispatch, reaction, createGift, updateGift, deleteGift, getGifts, getVendorGifts, getReactions, getOrdersAdmin, getGiftFromId, review, getBlockList, unblock } = require("../controllers/giftsControllers");

router.post('/sendGift', sendGift);
router.post('/setGiftInLocker', setGiftInLocker);
router.post('/acceptOrDecline', acceptOrDecline);
router.post('/dispatch', dispatch);
router.post('/reaction', reaction);
router.post('/createGift', createGift);
router.post('/updateGift', updateGift);
router.post('/deleteGift', deleteGift);
router.get("/getGifts", getGifts);
router.get("/getVendorGifts", getVendorGifts);
router.get("/getReactions", getReactions);
router.get("/getOrdersAdmin", getOrdersAdmin);
router.post("/getGiftFromId", getGiftFromId);
router.post("/review", review);
router.get("/getBlockList", getBlockList);
router.post("/unblock", unblock);

module.exports = router;