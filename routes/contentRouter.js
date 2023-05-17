const express = require('express');
const router = express.Router();

const { createContent, deleteContent } = require("../controllers/contentController");

router.post("/createContent", createContent);
router.post("/deleteContent", deleteContent);

module.exports = router;