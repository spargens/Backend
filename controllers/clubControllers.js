const { StatusCodes } = require('http-status-codes');
const Club = require('../models/club');
const User = require('../models/user');
const Admin = require('../models/admin');
const Content = require("../models/content");


//Middleware

const checkAuthorization = async (clubId, id) => {
    console.log("fred");
    const club = await Club.findById((clubId));
    console.log(club)
    if (club) {
        if (club.mainAdmin === id) return "Fully-authorized";
        let admins = club.adminId;
        let matchedAdmin = admins.find((item) => item === id);
        if (matchedAdmin) return "Authorized";
        return "Not-authorized";
    }
    else {
        return "Club not found";
    }
}


const checkIsMember = async (clubId, userId) => {
    const club = await Club.findById((clubId));
    if (club) {
        let clubMembers = club.members;
        let matchedMember = clubMembers.find((item) => item === userId);
        if (matchedMember) return "Is a member";
        return "Not a member";
    }
    else {
        return "Club not found";
    }
}


//Controller 1
const createClub = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const club = await Club.create({ ...req.body, adminId: [req.user.id], mainAdmin: req.user.id }, (err, club) => {
            if (err) return console.error(err);
            if (req.user.role === "admin") {
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let data = { clubId: club._id };
                    admin.clubs.push(data);
                    admin.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).json({ club });
                    })
                })
            }
            if (req.user.role === "user") {
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let data = { clubId: club._id.toString() };
                    user.clubs.push(data);
                    user.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).json({ club });
                    })
                })
            }
        });

    }
    else {
        return res.status(StatusCodes.OK).send('Sorry you are not authorized to create a new club.')
    }
}

//Controller 2
const deleteClub = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized") {
            if (req.user.role === "admin") {
                const deletedClub = await Club.findByIdAndRemove({ _id: clubId });
                Admin.findById((req.user.id), (err, admin) => {
                    if (err) return console.error(err);
                    let clubs = admin.clubs;
                    clubs.filter((item) => { item !== clubId });
                    admin.clubs = [];
                    admin.clubs = clubs;
                    admin.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Club was successfully deleted.");
                    })
                })
            }
            if (req.user.role === "user") {
                const deletedClub = await Club.findByIdAndRemove({ _id: clubId });
                User.findById((req.user.id), (err, user) => {
                    if (err) return console.error(err);
                    let clubs = user.clubs;
                    clubs = clubs.filter((item) => { item.clubId !== clubId });
                    user.clubs = [];
                    user.clubs = clubs;
                    user.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Club was successfully deleted.");
                    })
                })
            }
        }
        if (isAuthorized === "Authorized" || isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send('You are not authorized to delete the club.');
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to access the route of deleting the club.')
    }
}

//Controller 3
const joinAsMember = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            if (club) {
                if (req.user.role === "user") {
                    User.findById((req.user.id), (err, user) => {
                        if (err) return console.error(err);
                        user.clubs.push(clubId);
                        user.save();
                    });
                }
                if (req.user.role === "admin") {
                    Admin.findById((req.user.id), (err, admin) => {
                        if (err) return console.error(err);
                        admin.clubs.push(clubId);
                        admin.save();
                    });
                }
                club.members.push(req.user.id);
                let len = club.xAxisData.length;
                let lastElement = club.xAxisData[len - 1];
                let newElement = lastElement + 1;
                club.xAxisData.push(newElement);
                club.yAxisData.push(new Date());
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("You have successfully joined as the member of the club.")
                });
            }
            else {
                return res.status(StatusCodes.OK).send("No such club found.")
            }

        })
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to be the member of the club.')
    }
}

//Controller 4
const leaveAsMember = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            if (club) {
                if (req.user.role === "user") {
                    User.findById((req.user.id), (err, user) => {
                        if (err) return console.error(err);
                        let clubs = user.clubs;
                        clubs = clubs.filter((item) => { item !== clubId });
                        user.clubs = [];
                        user.clubs = clubs;
                        user.save();
                    });
                }
                if (req.user.role === "admin") {
                    Admin.findById((req.user.id), (err, admin) => {
                        if (err) return console.error(err);
                        let clubs = admin.clubs;
                        clubs = clubs.filter((item) => { item !== clubId });
                        admin.clubs = [];
                        admin.clubs = clubs;
                        admin.save();
                    });
                }
                let clubMembers = club.members;
                clubMembers = clubMembers.filter((item) => item !== req.user.id);
                club.members = [];
                club.members = clubMembers;
                let len = club.xAxisData.length;
                let lastElement = club.xAxisData[len - 1];
                let newElement = lastElement - 1;
                club.xAxisData.push(newElement);
                club.yAxisData.push(new Date());
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("You have successfully leaved as the member of the club.")
                });
            }
            else {
                return res.status(StatusCodes.OK).send("No such club found.")
            }

        })
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to access the route of leaving as member of the club.')
    }
}

//Controller 5
const addAsMember = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, userId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                if (club) {
                    User.findById((userId), (err, user) => {
                        if (err) return console.error(err);
                        user.clubs.push(clubId);
                        user.save();
                    });
                    club.members.push(userId);
                    let len = club.xAxisData.length;
                    let lastElement = club.xAxisData[len - 1];
                    let newElement = lastElement + 1;
                    club.xAxisData.push(newElement);
                    club.yAxisData.push(new Date());
                    club.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Successfully added the member of the club.")
                    });
                }
                else {
                    return res.status(StatusCodes.OK).send("No such club found.");
                }
            })
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to add members to the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to add members to the club.');
    }
}

//Controller 6
const removeAsMember = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, userId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                if (club) {
                    User.findById((userId), (err, user) => {
                        if (err) return console.error(err);
                        let clubs = user.clubs;
                        clubs = clubs.filter((item) => { item !== clubId });
                        user.clubs = [];
                        user.clubs = clubs;
                        user.save();
                    });
                    let clubMembers = club.members;
                    clubMembers = clubMembers.filter((item) => item !== userId);
                    club.members = [];
                    club.members = clubMembers;
                    let len = club.xAxisData.length;
                    let lastElement = club.xAxisData[len - 1];
                    let newElement = lastElement - 1;
                    club.xAxisData.push(newElement);
                    club.yAxisData.push(new Date());
                    club.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Successfully removed the member of the club.")
                    });
                }
                else {
                    return res.status(StatusCodes.OK).send("No such club found.");
                }
            })
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to remove members from the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to remove members from the club.');
    }
}

//Controller 7
const addAdmin = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, userId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized") {
            const isMember = await checkIsMember(clubId, userId);
            if (isMember === "Is a member") {
                Club.findById((clubId), (err, club) => {
                    if (err) return console.error(err);
                    club.adminId.push(userId);
                    club.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Admin successfully added");
                    })
                })
            }
            if (isMember === "Not a member") {
                return res.status(StatusCodes.OK).send("You have to first become member of the club.");
            }
        }
        if (isAuthorized === "Authorized" || isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to add admin to the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of adding admin to the club.")
    }
};

//Controller 8
const removeAdmin = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, userId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                let admins = club.adminId;
                admins = admins.filter((item) => item !== userId);
                club.adminId = [];
                club.adminId = admins;
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Admin has been successfully removed.")
                })
            })
        }
        if (isAuthorized === "Authorized" || isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to remove admin from the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of removing admin from the club.")
    }
};

//Controller 9
const postEvent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, event } = req.body;
        event = { ...event, postedBy: req.user.id }
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err)
                club.upcomingEvent.push(event);
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully posted event!")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be admin to post an event.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of posting an event.")
    }
}

//Controller 10
const removeEvent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, eventId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err)
            let events = club.upcomingEvent;
            let mainAdmin = club.mainAdmin;
            let event = events.find((item) => item.id === eventId);
            if (event.postedBy === req.user.id || mainAdmin === req.user.id) {
                events = events.filter((item) => item.id !== eventId)
                club.upcomingEvent = [];
                club.upcomingEvent = [...events];
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully removed event!")
                })
            }
            else {
                return res.status(StatusCodes.OK).send("Not authorized to remove event!")
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of removing an event.")
    }
}

//Controller 11
const postContent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, contentId } = req.body;
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            let data = { contentId, postedBy: req.user.id, timeStamp: new Date() };
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err)
                club.content.push(data);
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully posted content!")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be admin to post a content.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of posting a content.")
    }
}

//Controller 12
const removeContent = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, contentId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err)
            let contents = club.content;
            let mainAdmin = club.mainAdmin;
            let content = contents.find((item) => item.contentId === contentId);
            if (content.postedBy === req.user.id || mainAdmin === req.user.id) {
                contents = contents.filter((item) => item.contentId !== contentId)
                club.content = [];
                club.content = [...contents];
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully removed content!")
                })
            }
            else {
                return res.status(StatusCodes.OK).send("Not authorized to remove content!")
            }
        })
    }
}


//Controller 13
const postGallery = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, url, id } = req.body;
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            let data = { url, id, postedBy: req.user.id };
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err)
                club.gallery.push(data);
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully posted in gallery!")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be admin to post in gallery!")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of posting in gallery.")
    }
}

//Controller 14
const removeGallery = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, id } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err)
            let gallery = club.gallery;
            let mainAdmin = club.mainAdmin;
            let image = gallery.find((item) => item.id === id);
            if (image.postedBy === req.user.id || mainAdmin === req.user.id) {
                gallery = gallery.filter((item) => item.id !== id)
                club.gallery = [];
                club.gallery = [...gallery];
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully removed from gallery!")
                })
            }
            else {
                return res.status(StatusCodes.OK).send("Not authorized to remove from gallery!")
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of removing from gallery.")
    }
}

//Controller 15
const addNotifications = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, notification } = req.body;
        notification = { ...notification, postedBy: req.user.id }
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                club.notifications.push(notification);
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Notification was successfully added.");
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be an admin to add notifications to the club.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to add notifications to the club.')
    }
}

//Controller 16
const deleteNotifications = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, uid } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            let notifications = club.notifications;
            let mainAdmin = club.mainAdmin;
            let notification = notifications.find((item) => item.uid === uid);
            if (notification.postedBy === req.user.id || mainAdmin === req.user.id) {
                notifications = notifications.filter((item) => item.uid !== uid);
                club.notifications = [];
                club.notifications = [...notifications];
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Notification has been successfully deleted.");
                })
            }
            else {
                return res.status(StatusCodes.OK).send("You have to be admin to delete notifications from the club.");
            }
        })
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to delete notifications from the club.')
    }
}

//Controller 17
const editProfile = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { clubId, field, data } = req.body;
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err)
                if (field === "name") {
                    club.name = data;
                }
                else if (field === "motto") {
                    club.motto = data;
                }
                else if (field === "featuringImg") {
                    club.featuringImg = data;
                }
                else if (field === "chiefImage") {
                    club.chiefImage = data;
                }
                else if (field === "chiefMsg") {
                    club.chiefMsg = data;
                }
                else if (field === "tags") {
                    club.tags = [];
                    club.tags = [...data]
                }
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Profile successfully updated!")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be main admin to edit the profile.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access this route of editing club's profile.")
    }
}

//Controller 18
const addTeamMember = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { clubId, id, pos } = req.body;
        let data = { id, pos };
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized") {
            const isMember = await checkIsMember(clubId, id);
            const isAtHigherPost = await checkAuthorization(clubId, id)
            if (isAtHigherPost === "Fully-authorized" || isAtHigherPost === "Authorized" || isMember === "Is a member") {
                Club.findById((clubId), (err, club) => {
                    if (err) return console.error(err)
                    club.team.push(data);
                    club.save((err, update) => {
                        if (err) return console.error(err)
                        return res.status(StatusCodes.OK).send("Successfully added to the team!")
                    })
                })
            }
            else {
                return res.status(StatusCodes.OK).send("The user has to be at least member of the club to be part of the team.")
            }

        }
        else {
            return res.status(StatusCodes.OK).send("You have to be main admin to edit club's team.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the route of updating club's team profile.")
    }
}

//Controller 19
const removeTeamMember = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { clubId, id } = req.body;
        const isAuthorized = await checkAuthorization(clubId, req.user.id);
        if (isAuthorized === "Fully-authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err)
                let team = club.team;
                team = team.filter((item) => item.id !== id);
                club.team = [];
                club.team = [...team];
                club.save((err, update) => {
                    if (err) return console.error(err)
                    return res.status(StatusCodes.OK).send("Successfully removed from team!")
                })
            })
        }
        else {
            return res.status(StatusCodes.OK).send("You have to be main admin to edit club's team.")
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the route of updating club's team profile.")
    }
}

//Controller 14
const changeTier = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId, tier } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            club.tier = tier;
            let amt;
            if (tier === "Basic") amt = 0;
            else if (tier === "Advance") amt = 499;
            else if (tier === "Pro") amt = 999;
            else return res.status(StatusCodes.OK).send("Invalid tier.");
            club.tier = tier;
            let now = new Date()
            let next30days = new Date(now.setDate(now.getDate() + 30))
            club.payment = { dueDate: next30days, amt: amt };
            club.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send(`Tier has been upgraded to ${tier}.`)
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not allowed to upgrade the tier of the clubs.")
    }
}

//Controller 15
const receivePayment = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            const payment = club.payment;
            let lastDate = new Date(payment.dueDate.toString());
            const amt = payment.amt;
            const nextDate = new Date(lastDate.setDate(lastDate.getDate() + 30));
            const newPayment = { dueDate: nextDate, amt: amt };
            club.payment = newPayment;
            club.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Payment successfully received.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to receive club membership fee. ")
    }
}

//Controller 16
const getAllEvents = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            let data = club.upcomingEvent;
            return res.status(StatusCodes.OK).json(data);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the events of the club.")
    }
}

//Controller 17
const getAllMembers = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            let data = club.members;
            return res.status(StatusCodes.OK).json(data);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the members of the club.")
    }
}

//Controller 18
const getClub = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId } = req.body;
        const club = await Club.findById((clubId));
        if (club) return res.status(StatusCodes.OK).json(club);
        else return res.status(StatusCodes.OK).send("Could not find the club.");
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the club data.");
    }
}

//Controller 19
const getAllClub = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const clubs = await Club.find({}, { secondaryImg: 1, name: 1, tags: 1, motto: 1 });
        return res.status(StatusCodes.OK).json(clubs);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the entire club data.");
    }
}

//Controller 20
const setVisibility = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId, visible } = req.body;
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err);
            club.visible = visible;
            club.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send(`Club visibility set to ${visible}`);
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to set the visibility of the club.")
    }
}

//Controller 21
const getClubsByTag = async (req, res) => {
    const { tag } = req.query;
    const clubs = await Club.find({ tags: new RegExp(tag, "i", "g") }, { secondaryImg: 1, name: 1, tags: 1, motto: 1 });
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
    return res.status(StatusCodes.OK).json(clubs);
}

//Controller 22
const getLikeStatus = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { contentId } = req.query;
        const content = await Content.findById((contentId), { likes: 1, _id: 0 });
        let liked = content.likes.includes(req.user.id);
        return res.status(StatusCodes.OK).json({ liked })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to get the like status. ");
    }
}

//Controller 23
const getLatestContent = async (req, res) => {
    const { clubId } = req.query;
    if (req.user.role === "user") {
        const user = await User.findById(req.user.id);
        let lastActive = user.lastActive;
        lastActive = new Date(lastActive);
        let arr = [];
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err)
            let contents = club.content;
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
        Club.findById((clubId), (err, club) => {
            if (err) return console.error(err)
            let contents = club.content;
            for (let i = 0; i < contents.length; i++) {
                let content = contents[i];
                if (lastActive - new Date(content.timeStamp) < 0)
                    arr.push(content);
            }
            return res.status(StatusCodes.OK).json(arr);
        })
    }
}

//Controller 24
const getClubsPartOf = async (req, res) => {
    if (req.user.role === "user") {
        const user = await User.findById((req.user.id), { _id: 0, clubs: 1 });
        return res.status(StatusCodes.OK).json(user)
    }
    else if (req.user.role === "admin") {
        const user = await Admin.findById((req.user.id), { _id: 0, clubs: 1 });
        return res.status(StatusCodes.OK).json(user)
    }
}

//Controller 25
const getClubProfile = async (req, res) => {
    const { clubId } = req.query;
    const club = await Club.findById((clubId), { _id: 0, name: 1, secondaryImg: 1 })
    return res.status(StatusCodes.OK).json(club)
}





module.exports = {
    createClub, deleteClub, joinAsMember, leaveAsMember, addAsMember, removeAsMember, addAdmin, removeAdmin,
    addNotifications, deleteNotifications, changeTier, receivePayment, getAllEvents, getAllMembers, getClub, setVisibility,
    getAllClub, postEvent, removeEvent, postContent, removeContent, postGallery, removeGallery, editProfile, addTeamMember,
    removeTeamMember, getClubsByTag, getLikeStatus, getLatestContent, getClubsPartOf, getClubProfile
}