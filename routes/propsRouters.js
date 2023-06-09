const express = require('express');
const router = express.Router();

const { registerProp, deleteProp, delayedProps, returnProps, decommissionProp, propsStatistics, decommissionedProps, recommissionProp, dispatchProp, userPropReview, shiftArray, findAvailableProp, placeOrder, getPropOrder, nightBookingAvailability, placeNightOrder, getPropsOnField, pumpUpCreditScore, timeOfReturn, getStats, getCreditScore } = require('../controllers/propsControllers');

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
router.get('/getPropsOnField', getPropsOnField);
router.post('/pumpUpCreditScore', pumpUpCreditScore);
router.post('/timeOfReturn', timeOfReturn);
router.post('/getStats', getStats);
router.get('/getCreditScore', getCreditScore);

module.exports = router;