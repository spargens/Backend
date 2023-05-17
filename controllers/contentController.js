const { StatusCodes } = require('http-status-codes');
const Content = require("../models/content");
const Admin = require("../models/admin");

//Controller 1
const createContent = async (req, res) => {
    const { contentType, sendBy, url } = req.body;
    let idOfSender = req.user.id;
    let content = await Content.create({ contentType, sendBy, url, idOfSender });
    return res.status(StatusCodes.OK).json(content);
}

//Controller 2
const deleteContent = async (req, res) => {
    const { contentId, adminId } = req.body;
    const content = await Content.findById(contentId);
    let isEligible = false;
    if (req.user.role === "admin" || content.idOfSender === req.user.id) isEligible = true;
    if (isEligible) {
        const deletedContent = await Content.findByIdAndDelete(contentId);
        Admin.findById((adminId), (err, admin) => {
            if (err) return console.error(err);
            admin.thrashUrls.push(deletedContent.url);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The content has been successfully deleted.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete this content as you are neither creator nor admin.")
    }
}

module.exports = { createContent, deleteContent };