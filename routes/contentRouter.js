const express = require('express');
const router = express.Router();

const { createContent, likeContent, comment, unlikeContent, deleteComment, deleteContent, getContent, getComments, getContentBySpan } = require("../controllers/contentController");

router.post("/createContent", createContent);
router.post("/deleteContent", deleteContent);
router.post("/likeContent", likeContent);
router.post("/comment", comment);
router.post("/unlikeContent", unlikeContent);
router.post("/deleteComment", deleteComment);
router.get("/getContent", getContent);
router.get("/getComments", getComments);
router.get("/getContentBySpan", getContentBySpan);

module.exports = router;