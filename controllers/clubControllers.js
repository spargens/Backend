const { StatusCodes } = require('http-status-codes');
const Club = require('../models/club');

//controller to create a club
//req configuration:
//authorization token in req header
//send data of new club in form of json object in req.body
//{ name:"Sheyn",motto:"Fly like an eagle",featuringImg:"xyz.com",gallery:[{url:"abc.com",id:"r30fe"},{url:"asc.com",id:"rfe30fe"}],chiefImage:"xyz.com", chiefMsg:"lets join to fly",upcomingEvent:[ {id:"f330439r3i",poster:"url",name:"eventName2023",description:"OneLiner",contacts:[{"img":"xyz.com","contactId":"xyz123"},{"img":"xyz.com","contactId":"xyz123"}],place:"sdma",time:"tomorrow 3 to 5pm"},{}],featuringMember:[{id:"f34f2w",image:"url",msg:"string one para",contactId:"idMacbease"},{}],workSpacePhotos:[{url:"xyz.com",id:"ff232"}],team:[{id:"f34ef23",image:"url",pos:"ceo",contactId:"idMacbease"},{}]}
//required fields:  name,motto,featuringImg,chiefImage,chiefMsg
//make sure you provide valid data for all the fields to ensure ui doesn't break down

const createClub = async (req, res) => {
    if (req.user.role === "admin") {
        const { name, motto, featuringImg, chiefImage, chiefMsg } = req.body;
        if (!name || !motto || !featuringImg || !chiefImage || !chiefMsg) {
            return res.status(StatusCodes.BAD_REQUEST).send('You have not provided enough details to create a new club.Read the docs and then proceed.')
        }
        const club = await Club.create({ ...req.body });
        return res.status(StatusCodes.CREATED).json({ club })
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to create a new club.')
    }
}

//controller to delete a club
//req configuration:
//authorization token in req header
//send id of the club in the req.body
//{clubId:"23hfu2308g3"}

const deleteClub = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId } = req.body;
        const deletedClub = await Club.findByIdAndRemove({ _id: clubId });
        if (deletedClub) {
            return res.status(StatusCodes.OK).json({ deleteClub })
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Was unable to find club and delete it!")
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to delete the club.')
    }
}

//controller to update single point data i.e, name,motto,featuringImg,chiefImg,chiefImg,
//req configuration:
//authorization token in req header
//send an object in req.body {clubId:"3r2j03455",data:{name:"Aero",motto:"built rockets"}}

const updateSinglePointData = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId, data } = req.body;
        const updatedClub = await Club.findByIdAndUpdate({ _id: clubId }, { ...data }, { new: true, runValidators: true });
        if (updatedClub) {
            return res.status(StatusCodes.OK).json({ updatedClub })
        }
        return res.status(StatusCodes.EXPECTATION_FAILED).send("Could not find the club to be updated.")
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update the data of club.')
    }
}

//controller to add a new element to multiple point data (array) i.e,gallery,upcomingEvent,featuringMember,workSpacePhotos,team
//req configuration:
//authorization token in req header
//send an object in req.body {clubId:"3r2j03455",updateField:"enum(gallery,upcomingEvent,featuringMember,workSpacePhotos,team)",data:"data to be pushed as a new element"}

const addToMultiplePointData = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId, updateField, data } = req.body;
        const club = await Club.findById({ _id: clubId });
        if (!club) {
            return res.status(StatusCodes.BAD_REQUEST).send("Cannot find the club.")
        }
        switch (updateField) {
            case "gallery": {
                club.gallery.push(...data);
                club.save();
                return res.status(StatusCodes.OK).send("New data successfully added to gallery field.")
            }
            case "upcomingEvent": {
                club.upcomingEvent.push(...data);
                club.save();
                return res.status(StatusCodes.OK).send("New data successfully added to upcoming events field.")
            }
            case "featuringMember": {
                club.featuringMember.push(...data);
                club.save();
                return res.status(StatusCodes.OK).send("New data successfully added to featuring members field.")
            }
            case "workSpacePhotos": {
                club.workSpacePhotos.push(...data);
                club.save();
                return res.status(StatusCodes.OK).send("New data successfully added to workSpacePhotos field.")
            }
            case "team": {
                club.team.push(...data);
                club.save();
                return res.status(StatusCodes.OK).send("New data successfully added to team field.")
            }
            default:
                return res.status(StatusCodes.BAD_REQUEST).send("The field you want to update either does not exist or is not an array.")
        }
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update the data of club.')
    }
}

//controller to delete an element from multiple point data (array) i.e,gallery,upcomingEvent,featuringMember,workSpacePhotos,team
//req configuration:
//authorization token in req header
//send an object in req.body {clubId:"3r2j03455",updateField:"enum(gallery,upcomingEvent,featuringMember,workSpacePhotos,team)",id:"id of the element to be deleted"}

const deleteFromMultiplePointData = async (req, res) => {
    if (req.user.role === "admin") {
        const { clubId, updateField, id } = req.body;
        const club = await Club.findById({ _id: clubId });
        if (!club) {
            return res.status(StatusCodes.BAD_REQUEST).send("Cannot find the club.")
        }
        switch (updateField) {
            case "gallery": {
                const index = club.gallery.findIndex((item) => item.id === id);
                club.gallery.splice(index, 1);
                club.save();
                return res.status(StatusCodes.OK).send("Data was successfully removed from the gallery field.")
            }
            case "upcomingEvent": {
                const index = club.upcomingEvent.findIndex((item) => item.id === id);
                club.upcomingEvent.splice(index, 1);
                club.save();
                return res.status(StatusCodes.OK).send("Data was successfully removed from the upcomingEvent field.")
            }
            case "featuringMember": {
                const index = club.featuringMember.findIndex((item) => item.id === id);
                club.featuringMember.splice(index, 1);
                club.save();
                return res.status(StatusCodes.OK).send("Data was successfully removed from the featuringMember field.")
            }
            case "workSpacePhotos": {
                const index = club.workSpacePhotos.findIndex((item) => item.id === id);
                club.workSpacePhotos.splice(index, 1);
                club.save();
                return res.status(StatusCodes.OK).send("Data was successfully removed from the workSpacePhotos field.")
            }
            case "team": {
                const index = club.team.findIndex((item) => item.id === id);
                club.team.splice(index, 1);
                club.save();
                return res.status(StatusCodes.OK).send("Data was successfully removed from the team field.")
            }
            default:
                return res.status(StatusCodes.BAD_REQUEST).send("The field you want to update either does not exist or is not an array.")
        }
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to update the data of club.')
    }
}



module.exports = { createClub, deleteClub, updateSinglePointData, addToMultiplePointData, deleteFromMultiplePointData }