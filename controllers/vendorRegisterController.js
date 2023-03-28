const { StatusCodes } = require('http-status-codes')
const Vendor = require('../models/vendor')

const registerVendor = async (req, res) => {
    if (req.user.role === "admin") {
        const { name, email, adminKey } = req.body
        const existingVendor = await Vendor.findOne({ name, email, adminKey })
        if (existingVendor) {
            return res.status(StatusCodes.OK).send('Already a vendor with these credentials exist')
        }
        const vendor = await Vendor.create({ ...req.body })
        const token = vendor.createJWT()
        res.status(StatusCodes.OK).json({ vendor: { name: vendor.name }, token })
    }
    else {
        console.log(req.user.role);
        return res.status(StatusCodes.OK).send("Sorry you are not authorized to register a new vendor.");
    }
}

module.exports = { registerVendor }