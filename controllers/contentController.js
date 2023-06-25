const { StatusCodes } = require('http-status-codes');
const Content = require("../models/content");
const Admin = require("../models/admin");
const User = require("../models/user");

//Controller 1
const createContent = async (req, res) => {
    const { contentType, sendBy, url, text, belongsTo, tags } = req.body;
    if (!contentType || !sendBy || !url || !text || !belongsTo) return res.status(StatusCodes.OK).send("Incomplete data.");
    let idOfSender = req.user.id;
    let data = { ...req.body, idOfSender };
    let content = await Content.create(data);
    return res.status(StatusCodes.OK).json(content);
}

//Controller 2
const likeContent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId, type } = req.body;
        Content.findById((contentId), (err, content) => {
            if (err) return console.error(err);
            content.likes.push(req.user.id);
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    user.likedContents.push({ contentId, type });
                    console.log(user.likedContents);
                    user.save();
                })
            }
            else {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    admin.likedContents.push({ contentId, type });
                    admin.save();
                })
            }
            content.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have successfully liked the content.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to like this content.")
    }
}

//Controller 3
const comment = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId, type, comment } = req.body;
        Content.findById((contentId), (err, content) => {
            if (err) return console.error(err);
            content.comments.push({ msg: comment, id: req.user.id });
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    user.commentedContents.push({ contentId, type, comment });
                    user.save();
                })
            }
            else {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    admin.commentedContents.push({ contentId, type, comment });
                    admin.save();
                })
            }
            content.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have successfully posted the comment.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to comment on this content.")
    }
}

//Controller 4
const unlikeContent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId } = req.body;
        Content.findById((contentId), (err, content) => {
            if (err) return console.error(err);
            let likes = content.likes;
            likes = likes.filter((item) => item !== req.user.id);
            content.likes = [];
            content.likes.push(...likes);
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let likedContents = user.likedContents;
                    likedContents = likedContents.filter((item) => item.contentId !== contentId);
                    user.likedContents = [];
                    user.likedContents.push(...likedContents);
                    user.save();
                })
            }
            else {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let likedContents = admin.likedContents;
                    likedContents = likedContents.filter((item) => item.contentId !== contentId);
                    admin.likedContents = [];
                    admin.likedContents.push(...likedContents);
                    admin.save();
                })
            }
            content.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have successfully unliked the content.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to unlike this content");
    }
}

//Controller 5
const deleteComment = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId } = req.body;
        Content.findById((contentId), (err, content) => {
            if (err) return console.error(err);
            let comments = content.comments;
            comments = comments.filter((item) => item.id !== req.user.id);
            content.comments = [];
            content.comments.push(...comments);
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let commentedContents = user.commentedContents;
                    commentedContents = commentedContents.filter((item) => item.contentId !== contentId);
                    user.commentedContents = [];
                    user.commentedContents.push(...commentedContents);
                    user.save();
                })
            }
            else {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let commentedContents = admin.commentedContents;
                    commentedContents = commentedContents.filter((item) => item.contentId !== contentId);
                    admin.commentedContents = [];
                    admin.commentedContents.push(...commentedContents);
                    admin.save();
                })
            }
            content.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have successfully deleted the comment.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete this comment");
    }
}

//Controller 6
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

//Controller 7
const getContent = async (req, res) => {
    const { contentId } = req.query;
    const content = await Content.findById(contentId);
    if (content) {
        return res.status(StatusCodes.OK).json(content);
    }
    else {
        return res.status(StatusCodes.OK).send("Could not find the content.");
    }
}

//Controller 8
const getComments = async (req, res) => {
    const { contentId } = req.query;
    const content = await Content.findById((contentId), { comments: 1, _id: 0 });
    return res.status(StatusCodes.OK).json(content);
}

module.exports = { createContent, likeContent, comment, unlikeContent, deleteComment, deleteContent, getContent, getComments };