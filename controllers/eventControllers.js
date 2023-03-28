const { StatusCodes } = require('http-status-codes');
const Event = require('../models/event');
const Admin = require('../models/admin');

//admin can create a new event using this function
//req configuration:
//authorization token in req header
//properties of new event is send in req body
//{event:"name",image:"url",dateInWords:"String",date:new Date("22-01-2023"),dlAvailable:true,dlTime:"2hr",place:"Auditorium",participate:"google form"}

const createEvent = async (req, res) => {
    if (req.user.role === "admin") {
        const event = await Event.create({ ...req.body });
        return res.status(StatusCodes.CREATED).json({ event });
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('Sorry you are not authorized to create an event.');
    }
}

//admin can delete an event using this function
//req configuration:
//authorization token in req header
//need to send the id of the event in form of req.body

const deleteEvent = async (req, res) => {
    if (req.user.role === "admin") {
        const { eventId } = req.body;
        const deletedEvent = await Event.findByIdAndRemove({ _id: eventId });
        if (deletedEvent) {
            return res.status(StatusCodes.OK).json({ deletedEvent })
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Was unable to find event and delete it!")
    }
    else {
        return res.status(StatusCodes.MISDIRECTED_REQUEST).send('You are not authorized to delete the event.')
    }
}

module.exports = { createEvent, deleteEvent };