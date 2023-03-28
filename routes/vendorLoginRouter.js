const express = require('express')
const router = express.Router()

const { loginVendor } = require('../controllers/vendorLoginController')

router.post('/login', loginVendor)

module.exports = router