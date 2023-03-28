const { StatusCodes } = require('http-status-codes')
const Vendor = require('../models/vendor')


const loginVendor = async (req, res) => {
    const { email, password, adminKey } = req.body
    const vendor = await Vendor.findOne({ email })
    if (!vendor) {
        return res.status(StatusCodes.OK).send('Vendor does not exist.')
    }
    const isPasswordCorrect = await vendor.comparePassword(password)
    if (!isPasswordCorrect) {
        return res.status(StatusCodes.OK).send('Wrong password')
    }

    const isadminKeyCorrect = await vendor.compareAdminkey(adminKey)
    if (!isadminKeyCorrect) {
        return res.status(StatusCodes.OK).send('Wrong admin key.')
    }

    const token = vendor.createJWT()
    res.status(StatusCodes.OK).json({ vendor: { name: vendor.name }, token })
}

module.exports = { loginVendor }