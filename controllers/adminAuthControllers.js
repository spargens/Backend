const { StatusCodes } = require('http-status-codes');
const Admin = require('../models/admin');

//Refer to Admin Authorization Documentation

//Controller 1
const registerAdmin = async (req, res) => {
    const { name, adminKey, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ name, adminKey, email });
    if (existingAdmin) {
        return res.status(StatusCodes.OK).send("Already an admin with these credentials exist.");
    }
    const admin = await Admin.create({ ...req.body });
    const token = admin.createJWT();
    res.status(StatusCodes.OK).json({ admin: { name: admin.name }, token });
}

//Controller 2
const loginAdmin = async (req, res) => {
    const { email, password, adminKey } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res.status(StatusCodes.OK).send("Admin does not exist.");
    }
    const isPasswordCorrect = await admin.comparePassword(password);
    const isAdminKeyCorrect = adminKey === admin.adminKey;
    if (isPasswordCorrect && isAdminKeyCorrect) {
        const token = admin.createJWT();
        return res.status(StatusCodes.OK).json({ admin: { name: admin.name }, token });
    }
    else {
        return res.status(StatusCodes.OK).send("Invalid credentials!");
    }
}

module.exports = { registerAdmin, loginAdmin };