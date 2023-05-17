const express = require("express");
const router = express.Router();

const { createCommunity, deleteCommunity, joinAsMember, leaveAsMember, uploadContent, deleteContent, flag, takeDown } = require("../controllers/communityControllers");

router.post("/createCommunity", createCommunity);
router.post("/deleteCommunity", deleteCommunity);
router.post("/joinAsMember", joinAsMember);
router.post("/leaveAsMember", leaveAsMember);
router.post("/uploadContent", uploadContent);
router.post("/deleteContent", deleteContent);
router.post("/flag", flag);
router.post("/takeDown", takeDown);

module.exports = router;