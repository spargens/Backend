const express = require('express')
const router = express.Router()
const { getAllVendors, getProductsByMood, getProducts, getProductById, verifyToken } = require('../controllers/frontendControllers')

router.route('/allVendors').get(getAllVendors)
router.route('/productsByMood').get(getProductsByMood)
router.route('/getGenericProducts').get(getProducts)
router.route('/getProductById').post(getProductById)
router.route('/verifyToken').post(verifyToken);

module.exports = router