const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;



const pinSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is needed."],
    },
    description: {
        type: String
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: [true, "User is required"],
        ref: 'User'
    },
    type: {
        type: String
    },
    file_uri: {
        type: String
    },
    file_name: {
        type: String
    },
    size: {
        type: String,
        required: [true, 'Select the size']
    },
    destination: {
        type: String,
        validate: [validator.isURL, 'Enter a valid URL.'],
        required: true
    }
})


module.exports = mongoose.model('Pin', pinSchema)