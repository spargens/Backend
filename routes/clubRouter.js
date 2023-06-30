const express = require('express');
const router = express.Router();

const { createClub, deleteClub, joinAsMember, leaveAsMember, addAsMember, removeAsMember, addAdmin, removeAdmin, addNotifications, deleteNotifications, changeTier, receivePayment, getAllEvents, getAllMembers, getClub, setVisibility, getAllClub, postEvent, removeEvent, postContent, removeContent, postGallery, removeGallery, editProfile, addTeamMember, removeTeamMember, getClubsByTag, getLikeStatus, getLatestContent, getClubsPartOf, getClubProfile } = require("../controllers/clubControllers");

router.post('/createClub', createClub);
router.post('/deleteClub', deleteClub);
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
router.post('/postEvent', postEvent);
router.post('/removeEvent', removeEvent);
router.post('/postContent', postContent);
router.post('/removeContent', removeContent);
router.post('/postGallery', postGallery);
router.post('/removeGallery', removeGallery);
router.post('/editProfile', editProfile);
router.post('/addTeamMember', addTeamMember);
router.post('/removeTeamMember', removeTeamMember);
router.get('/getClubsByTag', getClubsByTag);
router.get('/getLikeStatus', getLikeStatus);
router.get('/getLatestContent', getLatestContent);
router.get('/getClubsPartOf', getClubsPartOf);
router.get('/getClubProfile', getClubProfile);

module.exports = router;