const express = require('express');
const router = express.Router();

const { createClub, deleteClub, updateSinglePointData, addToMultiplePointData, deleteFromMultiplePointData } = require("../controllers/clubControllers");

router.post('/createClub', createClub);
router.post('/deleteClub', deleteClub);
router.post('/updateSinglePointData', updateSinglePointData);
router.post('/addToMultiplePointData', addToMultiplePointData);
router.post('/deleteFromMultiplePointData', deleteFromMultiplePointData);

module.exports = router;