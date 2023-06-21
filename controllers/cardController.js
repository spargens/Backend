const { StatusCodes } = require('http-status-codes');
const User = require("../models/user");
const Admin = require("../models/admin");
const Card = require("../models/card");

//Controller 1
const createCard = async (req, res) => {
    if (req.user.role === "user") {
        const { value, tags } = req.body;
        const card = await Card.create({ value, tags, creator: req.user.id, time: new Date() });
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            user.cards.push(card._id);
            user.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The card has been successfully created.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to create cards.")
    }
}


//Controller 2
const deleteCard = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { cardId } = req.body;
        const deletedCard = await Card.findByIdAndDelete({ _id: cardId });
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            let cards = user.cards;
            cards = cards.filter((item) => item === cardId);
            user.cards = [];
            user.cards.push(...cards);
            user.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The card hs been successfully deleted.");
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete the cards.")
    }
}

//Controller 3
const likeACard = async (req, res) => {
    if (req.user.role === "user") {
        const { cardId, creatorId } = req.body;
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            user.likedCards.push(cardId);
            user.notifications.push({ key: "likedACard", value: "You have liked a card.", data: { cardId, creatorId } });
            user.save();
        });
        User.findById((creatorId), (err, user) => {
            if (err) return console.error(err);
            user.notifications.push({ key: "likedACard", value: "Someone has liked your card.", data: { cardId, userId: req.user.id } });
            user.save();
        })
        Card.findById((cardId), (err, card) => {
            if (err) return console.error(err);
            card.likedBy.push(req.user.id);
            card.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("You have liked the card.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to like a card.");
    }
}


//Controller 4
const getLikedCards = async (req, res) => {
    if (req.user.role === "user") {
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err);
            let likedCards = user.likedCards;
            return res.status(StatusCodes.OK).json(likedCards);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read the liked cards.")
    }
}


//Controller 5
const getCardFromId = async (req, res) => {
    const { cardId } = req.body;
    let card = await Card.findById((cardId));
    return res.status(StatusCodes.OK).json(card);
}


//Controller 6
const getCardsOfUser = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        let id;
        if (req.user.role === "admin") {
            const { userId } = req.body;
            id = userId
        }
        if (req.user.role === "user") {
            id = req.user.id;
        }
        User.findById((id), (err, user) => {
            if (err) return console.error(err);
            const cards = user.cards;
            return res.status(StatusCodes.OK).json(cards);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read the cards of the user.")
    }
}

//Controller 7
const getCardsFromTag = async (req, res) => {
    const { tag } = req.body;
    const cards = await Card.find({ tags: new RegExp(tag, "i", "g") }).sort({ time: "-1" });
    return res.status(StatusCodes.OK).json(cards);
}

//Controller 8
const saveInterest = async (req, res) => {
    if (req.user.role === "user") {
        const { interests } = req.body;
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            user.interests = interests;
            user.save((err, update) => {
                if (err) return console.error(err)
                return res.status(StatusCodes.OK).send("Successfully updated interests.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to save interests.")
    }
}

//Controller 9
const getYourInterests = async (req, res) => {
    if (req.user.role === "user") {
        let data = { interests: [], name: "", image: "" };
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            data.interests = user.interests;
            data.name = user.name;
            data.image = user.image;
            return res.status(StatusCodes.OK).json(data)
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read interests.")
    }
}


//Controller 10
const getAllCards = async (req, res) => {
    const cards = await Card.find({});
    return res.status(StatusCodes.OK).json(cards);
}


//Controller 11
const unlikeACard = async (req, res) => {
    if (req.user.role === "user") {
        const { cardId } = req.body;
        User.findById((req.user.id), (err, user) => {
            if (err) return console.error(err)
            let likedCards = user.likedCards;
            likedCards = likedCards.filter((item) => item !== cardId);
            user.likedCards = [];
            user.likedCards = [...likedCards];
            user.save()
        })
        Card.findById((cardId), (err, card) => {
            if (err) return console.error(err)
            let likedBy = card.likedBy;
            likedBy = likedBy.filter((item) => item !== req.user.id);
            card.likedBy = [];
            card.likedBy = [...likedBy];
            card.save((err, update) => {
                if (err) return console.error(err)
                return res.status(StatusCodes.OK).send("Successfully disliked the card.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to dislike a card.");
    }
}


//Controller 12
const getUserBio = async (req, res) => {
    if (req.user.role === "user" || req.user.role === "admin") {
        const { userId } = req.query;
        User.findById((userId), (err, user) => {
            if (err) return console.error(err)
            let data = { name: "", image: "", course: "", clubsNo: 0 };
            data.name = user.name;
            data.image = user.image;
            data.course = user.course;
            data.clubsNo = user.communitiesPartOf.length;
            return res.status(StatusCodes.OK).json(data)
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read the bio of user.")
    }
}




module.exports = { createCard, deleteCard, likeACard, getLikedCards, getCardFromId, getCardsOfUser, getCardsFromTag, saveInterest, getYourInterests, getAllCards, unlikeACard, getUserBio };