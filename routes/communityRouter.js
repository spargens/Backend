const express = require("express");
const router = express.Router();

const { createCommunity, deleteCommunity, joinAsMember, leaveAsMember, uploadContent, deleteContent, flag, takeDown, updateStreak, likesAndPosts, rating, getAllCommunities, getCommunityById, getCommunityByTag, isMember, getContentOfACommunity
} = require("../controllers/communityControllers");

router.post("/createCommunity", createCommunity);
router.post("/deleteCommunity", deleteCommunity);
router.post("/joinAsMember", joinAsMember);
router.post("/leaveAsMember", leaveAsMember);
router.post("/uploadContent", uploadContent);
router.post("/deleteContent", deleteContent);
router.post("/flag", flag);
router.post("/takeDown", takeDown);
router.post("/updateStreak", updateStreak);
router.post("/likesAndPosts", likesAndPosts);
router.post("/rating", rating);
router.get("/getAllCommunities", getAllCommunities);
router.get("/getCommunityById", getCommunityById);
router.get("/getCommunityByTag", getCommunityByTag);
router.get("/isMember", isMember);
router.get("/getContentOfACommunity", getContentOfACommunity);

module.exports = router;