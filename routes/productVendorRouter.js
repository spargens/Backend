const express = require('express')
const router = express.Router()
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'productImage')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
const { createProduct, getProducts, updateProduct, deleteProduct, getAllProducts, thisWeekPerformance, acceptOrderVendor, acceptOrderUser, declineOrderVendor, declineOrderUser, setTimeVendor, setTimeUser, orderCompletedVendor, orderCompletedUser, getAllOrders, getAverageVisitors, getAverageVisitorsForSixWeeks, getAverageVisitorsForSixMonths, getRevenueFor6Days, getRevenueFor6Weeks, getRevenueFor6Months, getBestPerforming } = require('../controllers/productVendorControllers')

router.route('/').post(upload.single('image'), createProduct).get(getProducts).patch(updateProduct)
router.route('/deleteProduct').post(deleteProduct)
router.route('/acceptOrderVendor').post(acceptOrderVendor)
router.route('/acceptOrderUser').post(acceptOrderUser)
router.route('/declineOrderVendor').post(declineOrderVendor)
router.route('/declineOrderUser').post(declineOrderUser)
router.route('/setTimeVendor').post(setTimeVendor)
router.route('/setTimeUser').post(setTimeUser)
router.route('/orderCompletedVendor').post(orderCompletedVendor)
router.route('/orderCompletedUser').post(orderCompletedUser)
router.route('/getAllOrders').get(getAllOrders)
router.route('/getAverageVisitors').get(getAverageVisitors)
router.route('/getAverageVisitorsForSixWeeks').get(getAverageVisitorsForSixWeeks)
router.route('/getAverageVisitorsForSixMonths').get(getAverageVisitorsForSixMonths)
router.route('/getRevenueOf6Days').get(getRevenueFor6Days)
router.route('/getRevenueFor6Weeks').get(getRevenueFor6Weeks)
router.route('/getRevenueFor6Months').get(getRevenueFor6Months)
router.route('/getBestPerformingForLast6Days').post(getBestPerforming)


//psuedo route to make api call to fetch all the products owned by the vendor
router.route('/getAllProducts').get(getAllProducts)

//psuedo route to feed the number of sales and earned this week into the product schema
router.route('/thisWeekPerformance').post(thisWeekPerformance)



module.exports = router