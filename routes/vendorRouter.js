const express = require('express')
const router = express.Router()
const { getVendors, updateVendor, deleteVendor, createPriority, getPriorities, feedThreeBest, getThreebest } = require('../controllers/vendorControllers')

router.route('/').get(getVendors).patch(updateVendor).delete(deleteVendor)
router.route('/priorities').post(createPriority).get(getPriorities)
router.route('/bestPerforming').post(feedThreeBest).get(getThreebest)

module.exports = router