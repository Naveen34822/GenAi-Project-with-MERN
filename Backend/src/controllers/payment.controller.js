const { createOrder, verifyPaymentSignature, verifyWebhookSignature } = require("../services/razorpay.service")
const userModel = require("../models/user.model")

// ── PRO PLAN PRICE ───────────────────────────────────────────────────────────
const PRO_PLAN_AMOUNT = 29900 // Rs.299 in paise (1 rupee = 100 paise)

/**
 * @route  POST /api/payment/create-order
 * @desc   Step 1 of checkout — creates a Razorpay order and returns order_id.
 *         The frontend uses this order_id to open the Razorpay payment popup.
 * @access Private (user must be logged in)
 */
async function createOrderController(req, res) {
  try {
    const userId = req.user.id

    // Create a unique receipt string for this order
    // (Razorpay requires each receipt to be unique, max 40 chars)
    const receipt = `pro_${userId}_${Date.now()}`.slice(0, 40)

    // Call Razorpay API to create the order
    const order = await createOrder(PRO_PLAN_AMOUNT, receipt)

    // Send the order details back to the frontend
    // The frontend needs: order_id, amount, currency
    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    })
  } catch (err) {
    console.error("createOrderController error:", err)
    res.status(500).json({ message: "Failed to create payment order." })
  }
}

/**
 * @route  POST /api/payment/verify
 * @desc   Step 2 of checkout — verifies the payment signature after user pays.
 *         If signature is valid → upgrade user to Pro in the database.
 * @access Private (user must be logged in)
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
async function verifyPaymentController(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    // Validate all three fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details." })
    }

    // Verify the signature — this proves the payment is genuine
    const isGenuine = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })

    // SECURITY: If signatures don't match → reject. Never mark as paid!
    if (!isGenuine) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." })
    }

    // Signature matched → Payment is real! Upgrade user to Pro.
    // Set plan to "pro" and set an expiry 30 days from now
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await userModel.findByIdAndUpdate(req.user.id, {
      plan: "pro",
      planExpiresAt: thirtyDaysFromNow,
      razorpay_subscription_id: razorpay_payment_id // store payment_id as reference
    })

    res.status(200).json({
      message: "Payment verified! You are now a Pro member.",
      plan: "pro",
      planExpiresAt: thirtyDaysFromNow
    })
  } catch (err) {
    console.error("verifyPaymentController error:", err)
    res.status(500).json({ message: "Payment verification failed." })
  }
}

/**
 * @route  GET /api/payment/status
 * @desc   Returns the current user's plan info (free/pro, expiry, usage count)
 * @access Private
 */
async function getStatusController(req, res) {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("plan planExpiresAt interviewsThisMonth lastInterviewReset")

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Check if Pro plan has expired — if yes, downgrade to free automatically
    if (user.plan === "pro" && user.planExpiresAt && new Date() > user.planExpiresAt) {
      await userModel.findByIdAndUpdate(req.user.id, {
        plan: "free",
        planExpiresAt: null,
        razorpay_subscription_id: null
      })
      return res.status(200).json({
        plan: "free",
        planExpiresAt: null,
        interviewsThisMonth: user.interviewsThisMonth,
        freeLimit: 3
      })
    }

    // Calculate when the current 30-day trial window resets
    // This is: lastInterviewReset + 30 days
    const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
    const lastReset = new Date(user.lastInterviewReset)
    const resetsAt  = new Date(lastReset.getTime() + WINDOW_MS)

    res.status(200).json({
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      interviewsThisMonth: user.interviewsThisMonth,
      freeLimit: 3,
      resetsAt: resetsAt.toISOString() // exact date/time trial window resets
    })
  } catch (err) {
    console.error("getStatusController error:", err)
    res.status(500).json({ message: "Failed to fetch plan status." })
  }
}

/**
 * @route  POST /api/payment/webhook
 * @desc   Razorpay sends automatic notifications here when payment events happen.
 *         This endpoint must be PUBLIC (no JWT auth) because Razorpay calls it.
 * @access Public (but secured by webhook signature verification)
 *
 * IMPORTANT: This route uses express.raw() NOT express.json()
 * because we need the raw body to verify the signature!
 */
async function webhookController(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"]

    if (!signature) {
      return res.status(400).json({ message: "Missing webhook signature." })
    }

    // Verify the webhook came from Razorpay (not a hacker)
    const isValid = verifyWebhookSignature(req.body, signature)

    if (!isValid) {
      console.warn("Invalid webhook signature received!")
      return res.status(400).json({ message: "Invalid webhook signature." })
    }

    // Parse the raw body to get the event data
    const event = JSON.parse(req.body.toString())

    console.log("Razorpay webhook event:", event.event)

    // Handle different payment events
    if (event.event === "payment.captured") {
      // Payment was successfully captured — this is a backup to verifyPayment
      const paymentId = event.payload.payment.entity.id
      console.log("Payment captured:", paymentId)
    }

    if (event.event === "payment.failed") {
      // Payment failed — log it (optional: notify user via email)
      const paymentId = event.payload.payment.entity.id
      console.log("Payment failed:", paymentId)
    }

    // Always respond with 200 to acknowledge receipt
    // If you don't respond with 200, Razorpay will retry the webhook
    res.status(200).json({ status: "ok" })
  } catch (err) {
    console.error("webhookController error:", err)
    res.status(500).json({ message: "Webhook processing failed." })
  }
}

module.exports = {
  createOrderController,
  verifyPaymentController,
  getStatusController,
  webhookController
}
