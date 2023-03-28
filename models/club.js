const mongoose = require('mongoose');
const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide the name of the club.']
    },
    motto: {
        type: String,
        required: [true, 'Please provide the motto of the club.']
    },
    featuringImg: {
        type: String,
        required: [true, 'Please provide the motto of the club.']
    },
    //array of objects {url:"xyz.com",id:"ff232"}
    gallery: {
        type: Array
    },
    //url of a bg removed image to be featured on the top of the club page
    chiefImage: {
        type: String,
        required: [true, 'Please provide the motto of the club.']
    },
    chiefMsg: {
        type: String,
        required: [true, 'Please provide the message of the chief.']
    },
    //array of objects {id:"r3039fjf",poster:"url",name:"eventName2023",description:"OneLiner",contacts:[{"img":"xyz.com","contactId":"xyz123"}],place:"sdma",time:"tomorrow 3pm to 5pm"}
    upcomingEvent: {
        type: Array
    },
    //array of objects {id:"f34f2w",image:"url",msg:"string one para",contactId:"idMacbease"}
    featuringMember: {
        type: Array
    },
    //array of urls
    workSpacePhotos: {
        type: Array
    },
    //array of objects {id:"f34ef23",image:"url",pos:"ceo",contactId:"idMacbease"}
    team: {
        type: Array
    }
})

module.exports = mongoose.model('Club', clubSchema);