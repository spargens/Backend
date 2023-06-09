const { StatusCodes } = require("http-status-codes");
const Community = require("../models/community");
const Admin = require("../models/admin");
const User = require("../models/user");
const Content = require("../models/content");
const community = require("../models/community");

//Controller 1
const createCommunity = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { title, cover, secondaryCover, label, tag } = req.body;
        let creatorId = req.user.id;
        let creatorPos = req.user.role;
        let createdOn = new Date();
        let members = [req.user.id];
        let finalData = {
            title, cover, secondaryCover, label, creatorId, creatorPos, createdOn, tag, members
        };
        Community.create({ ...finalData }, (err, community) => {
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
            community.activeMembers = community.activeMembers + 1;
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    user.communitiesPartOf.push({ communityId, bestStreak: 0, currentStreak: 0, lastPosted: new Date(), totalLikes: 0, totalPosts: 0, rating: 0, joined: new Date() });
                    user.notifications.push({ key: "community", value: "You have joined the community.", data: communityId });
                    user.save();
                });
            }
            if (req.user.role === "admin") {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    admin.communitiesPartOf.push({ communityId, bestStreak: 0, currentStreak: 0, lastPosted: new Date(), totalLikes: 0, totalPosts: 0, rating: 0, joined: new Date() });
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
            community.activeMembers = community.activeMembers + 1;
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let communities = user.communitiesPartOf;
                    communities = communities.filter((item) => item.communityId !== communityId);
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
                    communities = communities.filter((item) => item.communityId !== communityId);
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
                community.content.push({ contentId, irrelevanceVote: 0, flagSaturated: false, flaggedBy: [], timeStamp: new Date() });
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
                let modifiedContent = { contentId: content.contentId, irrelevanceVote: vote, flagSaturated: flagSaturated, flaggedBy: [...content.flaggedBy, req.user.id], timeStamp: content.timeStamp };
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
        let sendBy = content.sendBy;
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err);
            if (community.creatorId === req.user.id || req.user.role === "admin") {
                let contents = community.content;
                contents = contents.filter((item) => item.contentId !== contentId);
                community.content = [];
                community.content.push(...contents);
                if (sendBy === "userCommunity") {
                    User.findById((senderId), (err, user) => {
                        if (err) return console.error(err);
                        let contribution = user.communityContribution;
                        contribution = contribution.filter((item) => item.contentId !== contentId);
                        user.communityContribution = [];
                        user.communityContribution.push(...contribution);
                        user.notifications.push({ key: "community", value: "Your content has been taken down", data: { communityId } });
                        user.save();
                    });
                }
                else {
                    Admin.findById((senderId), (err, admin) => {
                        if (err) return console.error(err);
                        let contribution = admin.communityContribution;
                        contribution = contribution.filter((item) => item.contentId !== contentId);
                        admin.communityContribution = [];
                        admin.communityContribution.push(...contribution);
                        admin.save();
                    });
                }
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


//Controller 9
const updateStreak = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { communityId } = req.body;
        if (req.user.role === "user") {
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                let lastPosted = dataToBeChanged.lastPosted;
                let today = new Date();
                const _MS_PER_DAY = 1000 * 60 * 60 * 24;
                const utc1 = Date.UTC(lastPosted.getFullYear(), lastPosted.getMonth(), lastPosted.getDate());
                const utc2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                const diff = Math.floor((utc2 - utc1) / _MS_PER_DAY);
                if (diff === 1) {
                    dataToBeChanged.currentStreak = dataToBeChanged.currentStreak + 1;
                    if (dataToBeChanged.currentStreak > dataToBeChanged.bestStreak) {
                        dataToBeChanged.bestStreak = dataToBeChanged.currentStreak;
                    }
                }
                else if (diff > 1) {
                    if (dataToBeChanged.currentStreak > dataToBeChanged.bestStreak) {
                        dataToBeChanged.bestStreak = dataToBeChanged.currentStreak;
                    }
                    dataToBeChanged.currentStreak = 1;
                }
                dataToBeChanged.lastPosted = new Date();
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Streak updated");
                })
            })
        }
        else {
            Admin.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                let lastPosted = dataToBeChanged.lastPosted;
                let today = new Date();
                const _MS_PER_DAY = 1000 * 60 * 60 * 24;
                const utc1 = Date.UTC(lastPosted.getFullYear(), lastPosted.getMonth(), lastPosted.getDate());
                const utc2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                const diff = Math.floor((utc2 - utc1) / _MS_PER_DAY);
                if (diff === 1) {
                    dataToBeChanged.currentStreak = dataToBeChanged.currentStreak + 1;
                    if (dataToBeChanged.currentStreak > dataToBeChanged.bestStreak) {
                        dataToBeChanged.bestStreak = dataToBeChanged.currentStreak;
                    }
                }
                else if (diff > 1) {
                    if (dataToBeChanged.currentStreak > dataToBeChanged.bestStreak) {
                        dataToBeChanged.bestStreak = dataToBeChanged.currentStreak;
                    }
                    dataToBeChanged.currentStreak = 1;
                }
                dataToBeChanged.lastPosted = new Date();
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Streak updated");
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to update streak.")
    }
}


//Controller 10
const likesAndPosts = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { communityId } = req.body;
        if (req.user.role) {
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communityContribution = user.communityContribution;
                let likes = 0;
                let posts = 0;
                communityContribution.map((item) => {
                    if (item.communityId === communityId) {
                        posts = posts + 1;
                    }
                })
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                dataToBeChanged.totalLikes = likes;
                dataToBeChanged.totalPosts = posts;
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Likes and posts updated");
                })
            })
        }
        else {
            Admin.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communityContribution = user.communityContribution;
                let likes = 0;
                let posts = 0;
                communityContribution.map((item) => {
                    if (item.communityId) {
                        posts = posts + 1;
                    }
                })
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                dataToBeChanged.totalLikes = likes;
                dataToBeChanged.totalPosts = posts;
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Likes and posts updated");
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to update number of likes and posts.");
    }
}


//Controller 11
const rating = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { communityId } = req.body;
        if (req.user.role === "user") {
            User.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                let bestStreak = dataToBeChanged.bestStreak;
                let currentStreak = dataToBeChanged.currentStreak;
                let totalPosts = dataToBeChanged.totalPosts;
                let rating = Math.floor((totalPosts * 13.6) + bestStreak * 1.4 + currentStreak * 1.7);
                dataToBeChanged.rating = rating;
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Rating updated.");
                })
            })
        }
        else {
            Admin.findById((req.user.id), (err, user) => {
                if (err) return console.error(err);
                let communitiesPartOf = user.communitiesPartOf;
                let dataToBeChanged = communitiesPartOf.filter((item) => item.communityId === communityId);
                let restOfData = communitiesPartOf.filter((item) => item.communityId !== communityId);
                dataToBeChanged = dataToBeChanged[0];
                let bestStreak = dataToBeChanged.bestStreak;
                let currentStreak = dataToBeChanged.currentStreak;
                let totalPosts = dataToBeChanged.totalPosts;
                let rating = Math.floor((totalPosts * 13.6) + bestStreak * 1.4 + currentStreak * 1.7);
                dataToBeChanged.rating = rating;
                restOfData.push(dataToBeChanged);
                communitiesPartOf = restOfData;
                user.communitiesPartOf = [];
                user.communitiesPartOf.push(...communitiesPartOf);
                user.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Rating updated.");
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to update the rating.");
    }
}

//Controller 12
const getAllCommunities = async (req, res) => {
    const community = await Community.find({}, { secondaryCover: 1, label: 1, activeMembers: 1, title: 1, tag: 1 });
    return res.status(StatusCodes.OK).json(community);
}

//Controller 13
const getCommunityById = async (req, res) => {
    const { communityId } = req.query;
    const community = await Community.findById(communityId);
    if (community) {
        return res.status(StatusCodes.OK).json(community)
    }
    else {
        return res.status(StatusCodes.OK).send("Community not found.")
    }
}


//Controller 14
const getCommunityByTag = async (req, res) => {
    const { tag } = req.query;
    const communities = await Community.find({ tags: new RegExp(tag, "i", "g") }, { secondaryCover: 1, title: 1, tag: 1, activeMembers: 1, label: 1 });
    if (req.user.role === "user") {
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            user.lastActive = new Date();
            user.save()
        })
    }
    else if (req.user.role === "admin") {
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err)
            admin.lastActive = new Date();
            admin.save()
        })
    }
    return res.status(StatusCodes.OK).json(communities);
}

//Controller 15
const isMember = async (req, res) => {
    const { communityId } = req.query;
    if (req.user.role === "user") {
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            let communitiesPartOf = user.communitiesPartOf;
            communitiesPartOf = communitiesPartOf.filter((item) => item.communityId === communityId);
            if (communitiesPartOf.length !== 0) {
                return res.status(StatusCodes.OK).send("You are member.")
            }
            else {
                return res.status(StatusCodes.OK).send("You are not a member.")
            }
        })
    }
    else if (req.user.role === "admin") {
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err)
            let communitiesPartOf = admin.communitiesPartOf;
            communitiesPartOf = communitiesPartOf.filter((item) => item.communityId === communityId);
            if (communitiesPartOf.length !== 0) {
                return res.status(StatusCodes.OK).send("You are member.")
            }
            else {
                return res.status(StatusCodes.OK).send("You are not a member.")
            }
        })
    }
}

//Controller 16
const getContentOfACommunity = async (req, res) => {
    const { communityId } = req.query;
    const community = await Community.findById(communityId);
    const contents = community.content;
    return res.status(StatusCodes.OK).json(contents);
}

//Controller 17
const getCommunitiesPartOf = async (req, res) => {
    if (req.user.role === "user") {
        const user = await User.findById((req.user.id), { communitiesPartOf: 1, _id: 0 });
        return res.status(StatusCodes.OK).json(user)
    }
    else if (req.user.role === "admin") {
        const user = await Admin.findById((req.user.id), { communitiesPartOf: 1, _id: 0 });
        return res.status(StatusCodes.OK).json(user)
    }
}

//Controller 18
const getLatestContent = async (req, res) => {
    const { communityId } = req.query;
    if (req.user.role === "user") {
        const user = await User.findById(req.user.id);
        let lastActive = user.lastActive;
        lastActive = new Date(lastActive);
        let arr = [];
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err)
            let contents = community.content;
            for (let i = 0; i < contents.length; i++) {
                let content = contents[i];
                if (lastActive - new Date(content.timeStamp) < 0)
                    arr.push(content);
            }
            return res.status(StatusCodes.OK).json(arr);
        })
    }
    else if (req.user.role === "admin") {
        const admin = await Admin.findById(req.user.id);
        let lastActive = admin.lastActive;
        lastActive = new Date(lastActive);
        let arr = [];
        Community.findById((communityId), (err, community) => {
            if (err) return console.error(err)
            let contents = community.content;
            for (let i = 0; i < contents.length; i++) {
                let content = contents[i];
                if (lastActive - new Date(content.timeStamp) < 0)
                    arr.push(content);
            }
            return res.status(StatusCodes.OK).json(arr);
        })
    }
}


//Controller 19
const getCommunityProfile = async (req, res) => {
    const { communityId } = req.query;
    const community = await Community.findById((communityId), { title: 1, secondaryCover: 1, _id: 0 })
    return res.status(StatusCodes.OK).json(community)
}

//Controller 20
const getUserProfile = async (req, res) => {
    const { userId } = req.query;
    if (req.user.role === "user") {
        let user = await User.findById((userId), { image: 1, name: 1, _id: 0 });
        return res.status(StatusCodes.OK).json(user)
    }
    else if (req.user.role === "admin") {
        let user = await Admin.findById((userId), { image: 1, name: 1, _id: 0 });
        return res.status(StatusCodes.OK).json(user)
    }

}

//Controller 21
const getLikeAndFlagStatus = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId, communityId } = req.query;
        const content = await Content.findById((contentId), { likes: 1, _id: 0 });
        let liked = content.likes.includes(req.user.id);
        const communityData = await Community.findById((communityId), { content: 1, _id: 0 });
        let concernedData = communityData.content.find((item) => item.contentId === contentId);
        let flaggedBy = concernedData.flaggedBy;
        let flagged = flaggedBy.includes(req.user.id);
        return res.status(StatusCodes.OK).json({ liked, flagged })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to get the like and flag status. ");
    }
}

//Controller 22
const getBasicCommunityDataFromId = async (req, res) => {
    const { communityId } = req.query;
    const community = await Community.findById((communityId), { secondaryCover: 1, title: 1, tag: 1, activeMembers: 1 });
    return res.status(StatusCodes.OK).json(community)
}

//Controller 23
const getUserContributionCover = async (req, res) => {
    const { communityId } = req.query;
    if (req.user.role === "user") {
        let partOf = await User.findById((req.user.id), {
            communitiesPartOf: 1, _id: 0
        });
        let user = partOf.communitiesPartOf.find((item) => item.communityId === communityId);
        return res.status(StatusCodes.OK).json(user)
    }
    else if (req.user.role === "admin") {
        let partOf = await Admin.findById((req.user.id), {
            communitiesPartOf: 1, _id: 0
        });
        let user = partOf.communitiesPartOf.find((item) => item.communityId === communityId);
        return res.status(StatusCodes.OK).json(user)
    }

}

//Controller 24
const getContribution = async (req, res) => {
    const { communityId } = req.query;
    if (req.user.role === "user") {
        let communityContribution = await User.findById((req.user.id), {
            communityContribution: 1, _id: 0
        });
        communityContribution = communityContribution.communityContribution;
        communityContribution = communityContribution.filter(item => item.communityId === communityId);
        let actualContent = [];
        for (let k = 0; k < communityContribution.length; k++) {
            let contentId = communityContribution[k].contentId;
            let actualData = await Content.findById((contentId));
            actualData = actualData._doc;
            let data = { ...actualData };
            actualContent.push(data)
        }
        let finishedContent = [];
        for (let l = 0; l < actualContent.length; l++) {
            let data = actualContent[l];
            let userId = data.idOfSender;
            let communityId = data.belongsTo;
            let user = await User.findById((userId), { image: 1, name: 1, _id: 0 });
            let withPicData = { ...data, userName: user.name, userPic: user.image }
            finishedContent.push(withPicData);
        }
        return res.status(StatusCodes.OK).json(finishedContent)
    }
    else if (req.user.role === "admin") {
        let communityContribution = await Admin.findById((req.user.id), {
            communityContribution: 1, _id: 0
        });
        communityContribution = communityContribution.communityContribution;
        communityContribution = communityContribution.filter(item => item.communityId === communityId);
        let actualContent = [];
        for (let k = 0; k < communityContribution.length; k++) {
            let contentId = communityContribution[k].contentId;
            let actualData = await Content.findById((contentId));
            actualData = actualData._doc;
            let data = { ...actualData };
            actualContent.push(data)
        }
        let finishedContent = [];
        for (let l = 0; l < actualContent.length; l++) {
            let data = actualContent[l];
            let userId = data.idOfSender;
            let communityId = data.belongsTo;
            let user = await Admin.findById((userId), { image: 1, name: 1, _id: 0 });
            let withPicData = { ...data, userName: user.name, userPic: user.image }
            finishedContent.push(withPicData);
        }
        return res.status(StatusCodes.OK).json(finishedContent)
    }

}


//Controller 25
const getAllTags = async (req, res) => {
    const communities = await Community.find({}, { tag: 1, _id: 0 })
    return res.status(StatusCodes.OK).json(communities)
}


//Controller 26
const getLikedPosts = async (req, res) => {
    let user = await User.findById((req.user.id), { likedContents: 1, _id: 0 });
    user = user.likedContents;
    let data = [];
    for (let i = 0; i < user.length; i++) {
        let likedContent = user[i];
        if (likedContent.type === "community") {
            data.push(likedContent.contentId)
        }
    }
    return res.status(StatusCodes.OK).json(data)
}


//Controller 27
const getFastFeed = async (req, res) => {
    if (req.user.role === "user") {
        const user = await User.findById((req.user.id), { communitiesPartOf: 1, lastActive: 1, _id: 0 });
        let communities = user.communitiesPartOf;
        let lastActive = user.lastActive;
        lastActive = new Date(lastActive);
        let len = communities.length;
        let totalContent = [];
        for (let i = 0; i < len; i++) {
            let communityId = communities[i].communityId;
            let contents = await Community.findById((communityId), { content: 1, _id: 0 });
            contents = contents.content;
            totalContent.push(...contents);
        }
        // let finalContent = [];
        // for (let j = 0; j < totalContent.length; j++) {
        //     let content = totalContent[j];
        //     if (lastActive - new Date(content.timeStamp) < 0) {
        //         finalContent.push(content)
        //     }
        // }
        let finalContent = totalContent;
        let actualContent = [];
        for (let k = 0; k < finalContent.length; k++) {
            let contentId = finalContent[k].contentId;
            let irrelevanceVote = finalContent[k].irrelevanceVote;
            let actualData = await Content.findById((contentId));
            actualData = actualData._doc
            let data = { irrelevanceVote, ...actualData };
            actualContent.push(data)
        }
        let finishedContent = [];
        for (let l = 0; l < actualContent.length; l++) {
            let data = actualContent[l];
            let userId = data.idOfSender;
            let communityId = data.belongsTo;
            let user = await User.findById((userId), { image: 1, name: 1, _id: 0 });
            let community = await Community.findById((communityId), { title: 1, secondaryCover: 1, _id: 0 })
            let withPicData = { ...data, userName: user.name, userPic: user.image, communityTitle: community.title, communityCover: community.secondaryCover }
            finishedContent.push(withPicData);
        }

        return res.status(StatusCodes.OK).json({ finishedContent, lastActive })
    }
}

//Controller 28
const getFastNativeFeed = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { communityId } = req.query;
        const community = await Community.findById((communityId), { content: 1, _id: 0 });
        let contents = community.content;
        let actualContent = [];
        for (let k = 0; k < contents.length; k++) {
            let contentId = contents[k].contentId;
            let actualData = await Content.findById((contentId));
            actualData = actualData._doc;
            let data = { ...actualData };
            actualContent.push(data)
        }
        let finishedContent = [];
        for (let l = 0; l < actualContent.length; l++) {
            let data = actualContent[l];
            let userId = data.idOfSender;
            let communityId = data.belongsTo;
            let user = await User.findById((userId), { image: 1, name: 1, _id: 0 });
            let community = await Community.findById((communityId), { title: 1, secondaryCover: 1, _id: 0 })
            let withPicData = { ...data, userName: user.name, userPic: user.image, communityTitle: community.title, communityCover: community.secondaryCover }
            finishedContent.push(withPicData);
        }
        return res.status(StatusCodes.OK).json({ finishedContent })
    }
}






module.exports = { createCommunity, deleteCommunity, joinAsMember, leaveAsMember, uploadContent, deleteContent, flag, takeDown, updateStreak, likesAndPosts, rating, getAllCommunities, getCommunityById, getCommunityByTag, isMember, getContentOfACommunity, getCommunitiesPartOf, getLatestContent, getCommunityProfile, getUserProfile, getLikeAndFlagStatus, getBasicCommunityDataFromId, getUserContributionCover, getContribution, getAllTags, getLikedPosts, getFastFeed, getFastNativeFeed };