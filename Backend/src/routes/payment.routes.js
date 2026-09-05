const { Router } = require("express")
const paymentController = require("../controllers/payment.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const paymentRouter = Router()

/**
 * @route  POST /api/payment/create-order
 * @desc   Creates a Razorpay order — user must be logged in
 * @access Private
 */
paymentRouter.post(
  "/create-order",
  authMiddleware.authUser,
  paymentController.createOrderController
)

/**
 * @route  POST /api/payment/verify
 * @desc   Verifies payment signature and upgrades user to Pro
 * @access Private
 */
paymentRouter.post(
  "/verify",
  authMiddleware.authUser,
  paymentController.verifyPaymentController
)

/**
 * @route  GET /api/payment/status
 * @desc   Returns the user's current plan (free/pro) and usage
 * @access Private
 */
paymentRouter.get(
  "/status",
  authMiddleware.authUser,
  paymentController.getStatusController
)

/**
 * @route  POST /api/payment/webhook
 * @desc   Razorpay webhook — NO auth middleware (Razorpay calls this, not the user)
 *         Secured by webhook signature verification inside the controller
 * @access Public
 *
 * NOTE: express.raw() is applied in app.js specifically for this route
 *       BEFORE express.json() so the raw body is preserved for signature check
 */
paymentRouter.post(
  "/webhook",
  paymentController.webhookController
)

module.exports = paymentRouter
