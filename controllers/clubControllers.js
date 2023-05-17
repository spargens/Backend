const { StatusCodes } = require('http-status-codes');
const Club = require('../models/club');
const User = require('../models/user');
const Admin = require('../models/admin');
const Content = require("../models/content");


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


const checkAuthorization = async (clubId, id) => {
    const club = await Club.findById((clubId));
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

//Controller 9
const updateSinglePointData = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, data } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            let updatedClub;
            updatedClub = await Club.findByIdAndUpdate({ _id: clubId }, { ...data }, { new: true, runValidators: true });
            if (updatedClub) return res.status(StatusCodes.OK).send("The club data has been successfully updated.");
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to update the data of the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to update the data of the club.')
    }
}

//Controller 10
const addToMultiplePointData = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, updateField, data } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            const content = await Content.create({ contentType: "image", sendBy: "club", idOfSender: req.user.id, url: data.url });
            data.url = content._id;
            Club.findById({ _id: clubId }, (err, club) => {
                if (err) return console.error(err);
                switch (updateField) {
                    case "gallery": {
                        club.gallery.push({ ...data });
                        break;
                    }
                    case "videos": {
                        club.videos.push({ ...data });
                        break;
                    }
                    case "upcomingEvent": {
                        club.upcomingEvent.push({ ...data });
                        break;
                    }
                    case "featuringMember": {
                        club.featuringMember.push({ ...data });
                        break;
                    }
                    case "workSpacePhotos": {
                        club.workSpacePhotos.push({ ...data });
                        break;
                    }
                    case "team": {
                        club.team.push({ ...data });
                    }
                    default:
                        return res.status(StatusCodes.OK).send("The field you want to update either does not exist or is not an array.")
                }
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send(`New data was successfully added to ${updateField} field.`)
                });
            });

        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to add data to the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to update the data of club.')
    }
}

//Controller 11
const deleteFromMultiplePointData = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { clubId, updateField, itemId } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            let contentId;
            Club.findById({ _id: clubId }, (err, club) => {
                if (err) return console.error(err);
                switch (updateField) {
                    case "gallery": {
                        const index = club.gallery.findIndex((item) => item.id === itemId);
                        let data = club.gallery[index];
                        contentId = data.url;
                        club.gallery.splice(index, 1);
                        break;
                    }
                    case "videos": {
                        const index = club.videos.findIndex((item) => item.id === itemId);
                        let data = club.videos[index];
                        contentId = data.url;
                        club.videos.splice(index, 1);
                        break;
                    }
                    case "upcomingEvent": {
                        const index = club.upcomingEvent.findIndex((item) => item.id === itemId);
                        let data = club.upcomingEvent[index];
                        contentId = data.url;
                        club.upcomingEvent.splice(index, 1);
                        break;
                    }
                    case "featuringMember": {
                        const index = club.featuringMember.findIndex((item) => item.id === itemId);
                        let data = club.featuringMember[index];
                        contentId = data.url;
                        club.featuringMember.splice(index, 1);
                        break;
                    }
                    case "workSpacePhotos": {
                        const index = club.workSpacePhotos.findIndex((item) => item.id === itemId);
                        let data = club.workSpacePhotos[index];
                        contentId = data.url;
                        club.workSpacePhotos.splice(index, 1);
                        break;
                    }
                    case "team": {
                        const index = club.team.findIndex((item) => item.id === itemId);
                        let data = club.team[index];
                        contentId = data.url;
                        club.team.splice(index, 1);
                        break;
                    }
                    default:
                        return res.status(StatusCodes.OK).send("The field you want to update either does not exist or is not an array.")
                }
                club.save((err, update) => {
                    if (err) return console.error(err);
                })
                Content.findByIdAndUpdate((contentId), (err, content) => {
                    if (err) return console.error(err);
                    content.useful = false;
                    content.save((err, update) => {
                        if (err) return console.error(err);
                        return res.status(StatusCodes.OK).send("Data was successfully deleted.");
                    })
                });
            });
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to delete data from the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to update the data of club.')
    }
}

//Controller 12
const addNotifications = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, data } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                club.notifications.push(data);
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Notification was successfully added.");
                })
            })
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to add notifications to the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to add notifications to the club.')
    }
}

//Controller 13
const deleteNotifications = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let { clubId, uid } = req.body;
        const id = req.user.id;
        const isAuthorized = await checkAuthorization(clubId, id);
        if (isAuthorized === "Fully-authorized" || isAuthorized === "Authorized") {
            Club.findById((clubId), (err, club) => {
                if (err) return console.error(err);
                const index = club.notifications.findIndex((item) => item.uid === uid);
                club.notifications.splice(index, 1);
                club.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("Notification has been successfully deleted.");
                })
            })
        }
        if (isAuthorized === "Not-authorized") {
            return res.status(StatusCodes.OK).send("You are not authorized to delete notifications from the club.");
        }
        if (isAuthorized === "Club not found") {
            return res.status(StatusCodes.OK).send("No such club is active.");
        }
    }
    else {
        return res.status(StatusCodes.OK).send('You are not authorized to delete notifications from the club.')
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
        const clubs = await Club.find(({}));
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


module.exports = { createClub, deleteClub, updateSinglePointData, addToMultiplePointData, deleteFromMultiplePointData, joinAsMember, leaveAsMember, addAsMember, removeAsMember, addAdmin, removeAdmin, addNotifications, deleteNotifications, changeTier, receivePayment, getAllEvents, getAllMembers, getClub, setVisibility, getAllClub }