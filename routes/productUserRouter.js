const express = require('express')
const router = express.Router()
const { getProducts, reviewProduct, commentProduct, addToCart, deleteFromCart, getCartData, feedOrdersToVendor, feedOrdersToUser } = require('../controllers/productUserControllers')

router.route('/').get(getProducts)
router.route('/review').post(reviewProduct)
router.route('/comment').post(commentProduct)
router.route('/addToCart').post(addToCart)
router.route('/deleteFromCart').post(deleteFromCart)
router.route('/getCartData').get(getCartData)
router.route('/feedOrdersToVendor').post(feedOrdersToVendor)
router.route('/feedOrdersToUser').post(feedOrdersToUser)


module.exports = router