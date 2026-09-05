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
    },

    // ── Subscription / Plan ──────────────────────────────────────────────────
    plan: {
        type: String,
        enum: [ "free", "pro" ],
        default: "free"
        // "free"  → 3 interview reports/month, no live sessions
        // "pro"   → unlimited reports + Live Voice + Video Interview
    },

    razorpay_subscription_id: {
        type: String,
        default: null
        // Razorpay subscription ID (e.g. "sub_XXXXXXXXXX")
        // Used to identify which user a webhook belongs to
    },

    planExpiresAt: {
        type: Date,
        default: null
        // When the Pro plan expires (null = Free tier)
    },

    // ── Free Tier Usage Tracking ─────────────────────────────────────────────
    interviewsThisMonth: {
        type: Number,
        default: 0
        // Counts how many interview reports user generated this calendar month
    },

    lastInterviewReset: {
        type: Date,
        default: Date.now
        // Last time the monthly counter was reset (checked against current month)
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel