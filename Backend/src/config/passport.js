const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const userModel = require("../models/user.model")

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true // Required for production deployments behind a proxy (like Render/Heroku) to retain HTTPS in the callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this googleId
        let user = await userModel.findOne({ googleId: profile.id })

        if (user) {
          // User already linked with Google — return them
          return done(null, user)
        }

        // Check if a user with the same email already exists (email/password account)
        const email = profile.emails?.[0]?.value
        if (email) {
          user = await userModel.findOne({ email })
          if (user) {
            // Link Google account to existing email/password account
            user.googleId = profile.id
            user.avatar = profile.photos?.[0]?.value || null
            await user.save()
            return done(null, user)
          }
        }

        // New user — create account from Google profile
        const newUser = await userModel.create({
          googleId: profile.id,
          username: profile.displayName?.replace(/\s+/g, "_").toLowerCase() + "_" + profile.id.slice(-4),
          email: email,
          avatar: profile.photos?.[0]?.value || null,
          // No password for Google users
        })

        return done(null, newUser)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

module.exports = passport
