const express = require('express');
const router = express.Router();

const { createClub, deleteClub, updateSinglePointData, addToMultiplePointData, deleteFromMultiplePointData, joinAsMember, leaveAsMember, addAsMember, removeAsMember, addAdmin, removeAdmin, addNotifications, deleteNotifications, changeTier, receivePayment, getAllEvents, getAllMembers, getClub, setVisibility, getAllClub } = require("../controllers/clubControllers");

router.post('/createClub', createClub);
router.post('/deleteClub', deleteClub);
router.post('/updateSinglePointData', updateSinglePointData);
router.post('/addToMultiplePointData', addToMultiplePointData);
router.post('/deleteFromMultiplePointData', deleteFromMultiplePointData);
router.post('/joinAsMember', joinAsMember);
router.post('/leaveAsMember', leaveAsMember);
router.post('/addAsMember', addAsMember);
router.post('/removeAsMember', removeAsMember);
router.post('/addAdmin', addAdmin);
router.post('/removeAdmin', removeAdmin);
router.post('/addNotifications', addNotifications);
router.post('/deleteNotifications', deleteNotifications);
router.post('/changeTier', changeTier);
router.post('/receivePayment', receivePayment);
router.post('/getAllEvents', getAllEvents);
router.post('/getAllMembers', getAllMembers);
router.post('/getClub', getClub);
router.post('/setVisibility', setVisibility);
router.post('/getAllClub', getAllClub);

module.exports = router;