const { StatusCodes } = require("http-status-codes");
const Bag = require("../models/bag");
const Admin = require("../models/admin");

//Controller 1
const createBag = async (req, res) => {
    if (req.user.role === "admin") {
        const { keyWords, title, unsorted } = req.body;
        const bag = await Bag.create({ keyWords, title });
        if (unsorted) {
            Admin.findById((req.user.id), (err, admin) => {
                if (err) return console.error(err);
                let unsortedWords = admin.unsortedWord;
                unsortedWords = unsortedWords.filter((item) => item !== keyWords[0]);
                admin.unsortedWord = [];
                admin.unsortedWord.push(...unsortedWords);
                admin.save();
            })
        }
        return res.status(StatusCodes.OK).json(bag);
    }
    else {
        return (
            res.status(StatusCodes.OK).send("You are not authorized to create a bag.")
        )
    }
}

//Controller 2
const search = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { tag } = req.body;
        const regex = new RegExp(tag, "i", "g");
        const bags = await Bag.find({});
        let bagTitles = [];
        let len = bags.length;
        for (let i = 0; i < len; i++) {
            let bag = bags[i].keyWords;
            let title = bags[i].title;
            let keys = bag.length;
            for (let j = 0; j < keys; j++) {
                let keyWord = bag[j];
                let found = keyWord.match(regex);
                if (found) {
                    bagTitles.push(title);
                    break;
                }
            }
        }
        return res.status(StatusCodes.OK).json(bagTitles);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to insert in bag");
    }
}

//Controller 3
const getAllKeywords = async (req, res) => {
    if (req.user.role === "admin") {
        const bags = await Bag.find({});
        return res.status(StatusCodes.OK).json(bags);
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read the keywords.")
    }
}


//Controller 4
const unsortedTag = async (req, res) => {
    if (req.user.role === "admin" || req.user.role === "user") {
        const { keyWord, adminId } = req.body;
        let matched = false;
        const regex = new RegExp(keyWord, "i", "g");
        const bags = await Bag.find({});
        let len = bags.length;
        for (let i = 0; i < len; i++) {
            let bag = bags[i].keyWords;
            let keys = bag.length;
            for (let j = 0; j < keys; j++) {
                let existingWord = bag[j];
                let found = existingWord.match(regex);
                if (found) {
                    matched = true;
                }
            }
        }
        if (matched) {
            return res.status(StatusCodes.OK).send("The word already exists in the bag.")
        }
        else {
            Admin.findById((adminId), (err, admin) => {
                if (err) return console.error(err);
                admin.unsortedWord.push(keyWord);
                admin.save((err, update) => {
                    if (err) return console.error(err);
                    return res.status(StatusCodes.OK).send("The word has been successfully added to the unsorted list.")
                })
            })
        }
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to decided the unsorted tags.")
    }
}


//Controller 5
const getUnsortedTags = async (req, res) => {
    if (req.user.role === "admin") {
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err);
            const unsortedWords = admin.unsortedWord;
            return res.status(StatusCodes.OK).json(unsortedWords);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to access the unsorted keywords.")
    }
}


//Controller 6
const sortATag = async (req, res) => {
    if (req.user.role === "admin") {
        const { unsorted, bagTitle } = req.body;
        Bag.findOne({ title: bagTitle }, (err, bag) => {
            if (err) return console.error(err);
            bag.keyWords.push(unsorted);
            bag.save();
        })
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err);
            let unsortedWords = admin.unsortedWord;
            unsortedWords = unsortedWords.filter((item) => item !== unsorted);
            admin.unsortedWord = [];
            admin.unsortedWord.push(...unsortedWords);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The word has been successfully sorted.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to sort the tags.")
    }
}


//Controller 7
const getKeysFromBag = async (req, res) => {
    if (req.user.role === "admin") {
        const { bagTitle } = req.body;
        Bag.findOne({ title: bagTitle }, (err, bag) => {
            if (err) return console.error(err);
            let keys = bag.keyWords;
            return res.status(StatusCodes.OK).json(keys);
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to read keys from the bag.");
    }
}

//Controller 8
const deleteKeyFromBag = async (req, res) => {
    if (req.user.role === "admin") {
        const { word, bagTitle } = req.body;
        Bag.findOne({ title: bagTitle }, (err, bag) => {
            if (err) return console.error(err)
            let keyWords = bag.keyWords;
            keyWords = keyWords.filter((i) => i !== word);
            bag.keyWords = [];
            bag.keyWords.push(...keyWords);
            bag.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("Keyword has been successfully deleted.")
            })
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete a keyword.")
    }
}


//Controller 9
const deleteABag = async (req, res) => {
    if (req.user.role === "admin") {
        const { bagId } = req.body;
        let deletedBag = await Bag.findByIdAndDelete(bagId);
        return res.status(StatusCodes.OK).send("The bag has been successfully deleted.");
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete a bag.")
    }
}


//Controller 10
const deleteUnsortedWord = async (req, res) => {
    if (req.user.role === "admin") {
        const { word } = req.body;
        Admin.findById((req.user.id), (err, admin) => {
            if (err) return console.error(err);
            let unsortedWords = admin.unsortedWord;
            unsortedWords = unsortedWords.filter((item) => item !== word);
            admin.unsortedWord = [];
            admin.unsortedWord.push(...unsortedWords);
            admin.save((err, update) => {
                if (err) return console.error(err);
                return res.status(StatusCodes.OK).send("The unsorted word has been successfully deleted.")
            });
        })
    }
    else {
        return res.status(StatusCodes.OK).send("You are not authorized to delete an unsorted word.")
    }
}


//Controller 11
const masterSearch = async (req, res) => {
    const { tag } = req.query;
    console.log(tag);
    let bags = await Bag.find({ keyWords: new RegExp(tag, "i", "g") }, { keyWords: 1, _id: 0 });
    return res.status(StatusCodes.OK).json(bags);
}




module.exports = { createBag, search, getAllKeywords, unsortedTag, getUnsortedTags, sortATag, getKeysFromBag, deleteKeyFromBag, deleteABag, deleteUnsortedWord, masterSearch };