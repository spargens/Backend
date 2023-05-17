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
    //array of objects {url:"xyz.com",id:"ff232"}
    videos: {
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
    //array of objects {id:"r3039fjf",url:"url",name:"eventName2023",description:"OneLiner",contacts:[{"contactId":"xyz123"}],place:"sdma",time:"tomorrow 3pm to 5pm"}
    upcomingEvent: {
        type: Array
    },
    //array of objects {id:"f34f2w",url:"url",msg:"string one para",contactId:"idMacbease"}
    featuringMember: {
        type: Array
    },
    //array of urls [{url,id}]
    workSpacePhotos: {
        type: Array
    },
    //array of objects {id:"f34ef23",url:"url",pos:"ceo",contactId:"idMacbease"}
    team: {
        type: Array
    },
    //array of number of members
    xAxisData: {
        type: Array,
        default: [0]
    },
    //array of dates
    yAxisData: {
        type: Array,
        default: [0]
    },
    members: {
        type: Array
    },
    adminId: {
        type: Array
    },
    mainAdmin: {
        type: String
    },
    tier: {
        type: String,
        enum: ["Basic", "Advance", "Pro"],
        default: "Basic"
    },
    payment: {
        type: Object,
        default: { dueDate: null, amt: 0 }
    },
    //[{id:"",msg:""}]
    notifications: {
        type: Array
    },
    visible: {
        type: Boolean,
        default: true
    }
});


module.exports = mongoose.model('Club', clubSchema);