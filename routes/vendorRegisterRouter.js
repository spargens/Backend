const express = require('express')
const router = express.Router()

const { registerVendor } = require('../controllers/vendorRegisterController')

router.post('/register', registerVendor)

module.exports = router