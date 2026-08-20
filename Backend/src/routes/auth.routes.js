const { Router } = require("express")
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const passport = require("../config/passport")

const authRouter = Router()

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login", authController.loginUserController)

/**
 * @route GET /api/auth/logout
 * @description Clear token from user cookie and add to blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get the current logged in user details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

/**
 * @route GET /api/auth/google
 * @description Initiates Google OAuth flow
 * @access Public
 */
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
)

/**
 * @route GET /api/auth/google/callback
 * @description Google OAuth callback — issues JWT and redirects to frontend
 * @access Public
 */
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallbackController
)

module.exports = authRouter