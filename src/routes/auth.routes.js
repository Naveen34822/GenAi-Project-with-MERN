const {Router} = require("express")
const authRouter = Router();
const authController = require('../controllers/auth.controller')
const authMiddleWare = require("../middlewares/auth.middleware")
/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register",authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login",authController.loginUserConroller)

/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and the token in blacklist
 * @access public
 */
authRouter.get("/logout",authController.logoutUserController)

/**
 * @route GET /api/auth/et-me
 * @description get the current loggedin details
 * @access private
 */
authRouter.get("/get-me",authMiddleWare.authUser,authController.getMeController)

module.exports = authRouter;