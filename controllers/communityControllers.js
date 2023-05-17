const { StatusCodes } = require("http-status-codes");
const Community = require("../models/community");
const Admin = require("../models/admin");
const User = require("../models/user");
const Content = require("../models/content");

//Controller 1
const createCommunity = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { title, cover, secondaryCover, label } = req.body;
        let creatorId = req.user.id;
        let creatorPos = req.user.role;
        let createdOn = new Date();
        let finalData = {
            title, cover, secondaryCover, label, creatorId, creatorPos, createdOn
        };
        const community = await Community.create({ ...finalData }, (err, community) => {
            if (err) return console.error(err);
            if (req.user.role === "admin") {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let data = { communityId: community._id };
                    admin.communitiesCreated.push(data);
                    admin.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).json(community);
                    })
                })
            }
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let data = { communityId: community._id };
                    user.communitiesCreated.push(data);
                    let notification = { key: "community", value: "You have successfully created a community.", data: community._id };
                    user.notifications.push(notification);
                    user.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).json(community);
                    })
                })
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to create a new community.")
    }
}

//Controller 2
const deleteCommunity = async (req, res) => {
    if (req.user.role === "admin") {
        const { id } = req.body;
        const community = await Community.findByIdAndDelete(id);
        if (community) {
            return res.status(StatusCodes.OK).json({ deletedCommunity: community });
        }
        else {
            return res.status(StatusCodes.OK).send("Unable to find the community and delete it.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete a community.")
    }
}

//Controller 3
const joinAsMember = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { communityId } = req.body;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err)
            community.members.push(req.user.id);
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    user.communitiesPartOf.push(communityId);
                    user.notifications.push({ key: "community", value: "You have joined the community.", data: communityId });
                    user.save();
                });
            }
            if (req.user.role === "admin") {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    admin.communitiesPartOf.push(communityId);
                    admin.save();
                })
            }
            community.save((err, update) => {
                if (err) return console.error(err)
                return res.status(StatusCodes.OK).send("You have successfully joined the community.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to join the community.")
    }
}

//Controller 4
const leaveAsMember = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { communityId } = req.body;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err);
            let members = community.members;
            members = members.filter((item) => item !== req.user.id);
            community.members = [];
            community.members.push(...members);
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let communities = user.communitiesPartOf;
                    communities = communities.filter((item) => item !== communityId);
                    user.communitiesPartOf = [];
                    user.communitiesPartOf.push(...communities);
                    user.notifications.push({ key: "community", value: "You have successfully left the community.", data: communityId });
                    user.save();
                })
            }
            if (req.user.role === "admin") {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let communities = admin.communitiesPartOf;
                    communities = communities.filter((item) => item !== communityId);
                    admin.communitiesPartOf = [];
                    admin.communitiesPartOf.push(...communities);
                    admin.save();
                })
            }
            community.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have successfully left the community.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to leave the community.")
    }
}

//Controller 5
const uploadContent = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { contentId, communityId } = req.body;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err);
            let isMember = false;
            community.members.map((item) => {
                if (item === req.user.id) isMember = true;
            })
            if (isMember) {
                community.content.push({ contentId, irrelevanceVote: 0, flagSaturated: false, flaggedBy: [] });
                if (req.user.role === "user") {
                    User.findById((req.user.id), (err, user) => {
                        if (err) return console.error(err)
                        user.communityContribution.push({ contentId, communityId });
                        user.save();
                    })
                }
                if (req.user.role === "admin") {
                    Admin.findById((req.user.id), (err, admin) => {
                        if (err) return console.error(err)
                        admin.communityContribution.push({ contentId, communityId });
                        admin.save();
                    })
                }
                community.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Successfully posted.")
                })
            }
            else {
                return res.status(StatusCodes.OK).send("You have to first become the member of the community.")
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to post anything on this community.")
    }
}

//Controller 6
const deleteContent = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { contentId, communityId } = req.body;
        let isEligible = false;
        let content = await Content.findById(contentId);
        if (req.user.role === "admin" || content.idOfSender === req.user.id) isEligible = true;
        if (isEligible) {
            Community.findById((communityId), (err, community) => {
                if (err) return console.error(err);
                let contents = community.content;
                contents = contents.filter((item) => item.contentId !== contentId);
                community.content = [];
                community.content.push(...contents);
                if (req.user.role === "user") {
                    User.findById((req.user.id), (err, user) => {
                        if (err) return console.error(err);
                        let contribution = user.communityContribution;
                        contribution = contribution.filter((item) => { item.contentId !== contentId });
                        user.communityContribution = [];
                        user.communityContribution.push(...contribution);
                        user.save();
                    })
                }
                if (req.user.role === "admin") {
                    Admin.findById((req.user.id), (err, admin) => {
                        if (err) return console.error(err);
                        let contribution = admin.communityContribution;
                        contribution = contribution.filter((item) => item.contentId !== contentId);
                        admin.communityContribution = [];
                        admin.communityContribution.push(...contribution);
                        admin.save();
                    })
                }
                community.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Successfully deleted.")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You are not authorized to delete this content as you are neither creator nor the admin.")
        }
    }
}

//Controller 7
const flag = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { contentId, communityId } = req.body;
        const flaggedContent = await Content.findById(contentId);
        const senderId = flaggedContent.idOfSender;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err);
            let isMember = false;
            community.members.map((item) => {
                if (item === req.user.id) isMember = true;
            });
            let alreadyFlagged = false;
            let content;
            community.content.map((item) => {
                if (item.contentId === contentId) content = item;
            });
            content.flaggedBy.map((item) => {
                if (item === req.user.id) {
                    alreadyFlagged = true;
                }
            });
            if (alreadyFlagged) {
                return res.status(StatusCodes.OK).send("You have already flagged this content.");
            }
            else if (isMember || req.user.role === "admin") {
                let contents = community.content;
                contents = contents.filter((item) => item.contentId !== contentId);
                let vote = content.irrelevanceVote + 1;
                let flagSaturated = false;
                if (vote > 7) {
                    flagSaturated = true;
                    User.findById((community.creatorId), (err, user) => {
                        if (err) return console.error(err);
                        user.notifications.push({ key: "communityUrgent", value: "Flag is saturated.", data: { communityId, contentId } });
                        user.save();
                    });
                    User.findById((senderId), (err, user) => {
                        if (err) return console.error(err);
                        user.notifications.push({ key: "communityUrgent", value: "Flag is saturated.", data: { communityId, contentId } });
                        user.save();
                    });
                }
                let modifiedContent = { contentId: content.contentId, irrelevanceVote: vote, flagSaturated: flagSaturated, flaggedBy: [...content.flaggedBy, req.user.id] };
                contents.push(modifiedContent);
                community.content = [];
                community.content.push(...contents);
                community.save();
                if (req.user.role === "user") {
                    User.findById((req.user.id), (err, user) => {
                        if (err) return console.error(err);
                        user.notifications.push({ key: "community", value: "You have flagged a content.", data: { contentId, communityId } });
                        user.save((err, update) => {
                            if (err) return console.error(err);
                            return res.status(StatusCodes.OK).send("Successfully flagged the content.");
                        })
                    })
                }
                if (req.user.role === "admin") {
                    return res.status(StatusCodes.OK).send("Successfully flagged the content.");
                }
            }
            else {
                return res.status(StatusCodes.OK).send("You have to be either the member of the community or an admin to flag the content.");
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to flag a content.");
    }
}

//Controller 8
const takeDown = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId, communityId } = req.body;
        let content = await Content.findById(contentId);
        let senderId = content.idOfSender;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err);
            if (community.creatorId === req.user.id || req.user.role === "admin") {
                let contents = community.content;
                contents = contents.filter((item) => item.contentId !== contentId);
                community.content = [];
                community.content.push(...contents);
                User.findById((senderId), (err, user) => {
                    if (err) return console.error(err);
                    let contribution = user.communityContribution;
                    contribution = contribution.filter((item) => item.contentId !== contentId);
                    user.communityContribution = [];
                    user.communityContribution.push(...contribution);
                    user.notifications.push({ key: "community", value: "Your content has been taken down", data: { communityId } });
                    user.save();
                });
                community.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("The content has been successfully taken down.")
                })
            }
            else {
                return res.status(StatusCodes.OK).send("You are neither community admin nor Macbease admin.")
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to take down the community content.")
    }
}


module.exports = { createCommunity, deleteCommunity, joinAsMember, leaveAsMember, uploadContent, deleteContent, flag, takeDown };