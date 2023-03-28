const express = require('express');
const router = express.Router();

const { createEvent, deleteEvent } = require('../controllers/eventControllers');

router.post('/createEvent', createEvent);
router.post('/deleteEvent', deleteEvent);

module.exports = router;