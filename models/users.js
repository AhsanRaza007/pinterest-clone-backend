const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;



const userSchema = new Schema({
    email: {
        type: String,
        unique: [true, 'Account with this email already exists.'],
        required: [true, 'Enter an Email.'],
        validate: [validator.isEmail, 'Enter a valid Email.']
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Enter a password.'],
        minlength: [4, 'Password should be atleast four characters.']
    },
    jwt_token: {
        type: String,
        default: ''
    }
});


userSchema.pre('save', function(next){
    this.password = bcrypt.hashSync(this.password, 12);
    next();
});



module.exports = mongoose.model('User', userSchema);