const express = require('express')
const router = express.Router()
const { getAllVendors, getAllProducts, getProductsByMood, getProducts, getProductById, verifyToken } = require('../controllers/frontendControllers')

router.route('/allVendors').get(getAllVendors)
router.route('/productsByMood').get(getProductsByMood)
router.route('/getGenericProducts').get(getProducts)
router.route('/getProductById').post(getProductById)
router.route('/verifyToken').post(verifyToken);
router.route('/getAllProducts').get(getAllProducts);

module.exports = router