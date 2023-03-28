const express = require('express');
const router = express.Router();

const { registerProp, deleteProp, delayedProps, returnProps, decommissionProp, propsStatistics, decommissionedProps, recommissionProp, dispatchProp, userPropReview, shiftArray, findAvailableProp, placeOrder, getPropOrder, nightBookingAvailability, placeNightOrder } = require('../controllers/propsControllers');

router.post('/registerProp', registerProp);
router.post('/deleteProp', deleteProp);
router.post('/findAvailableProp', findAvailableProp);
router.post('/placeOrder', placeOrder);
router.post('/dispatchProp', dispatchProp);
router.post('/returnProps', returnProps);
router.post('/userPropReview', userPropReview);
router.get('/getPropOrder', getPropOrder);
router.post('/nightBookingAvailability', nightBookingAvailability);
router.post('/placeNightOrder', placeNightOrder);
router.post('/decommissionProp', decommissionProp);
router.post('/recommissionProp', recommissionProp);
router.post('/shiftArray', shiftArray);
router.get('/delayedProps', delayedProps);
router.get('/propsStatistics', propsStatistics);
router.get('/decommissionedProps', decommissionedProps);

module.exports = router;