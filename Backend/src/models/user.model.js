const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
    },

    password: {
        type: String,
        required: false // Optional for Google OAuth users
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true // allows multiple null values (non-Google users)
    },

    avatar: {
        type: String,
        default: null // stores Google profile picture URL
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel