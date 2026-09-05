const Razorpay = require("razorpay")
const crypto = require("crypto") // Built into Node.js — no install needed

// ── Initialize Razorpay SDK ──────────────────────────────────────────────────
// This creates a Razorpay "client" we can use to call the Razorpay API.
// The key_id and key_secret act like a username+password for your account.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

/**
 * Creates a Razorpay Order.
 *
 * WHY? Before a user can pay, Razorpay requires you to create an "order"
 * on the server. This order has an amount, currency, and a unique receipt.
 * The order_id is then sent to the frontend to open the payment popup.
 *
 * @param {number} amount - Amount in PAISE (Rs.299 = 29900 paise)
 * @param {string} receipt - A unique reference string (e.g. "order_user123")
 */
async function createOrder(amount, receipt) {
  // Validate: Razorpay minimum is 100 paise (Rs.1)
  if (!amount || amount < 100) {
    throw new Error("Amount must be at least 100 paise (Rs.1)")
  }

  const order = await razorpay.orders.create({
    amount,               // in paise (e.g. 29900 = Rs.299)
    currency: "INR",      // Indian Rupee
    receipt,              // your reference string — must be unique per order
    payment_capture: true // auto-capture payment after user pays
  })

  return order
}

/**
 * Verifies that a payment was genuine using HMAC-SHA256 signature.
 *
 * WHY? After the user pays, Razorpay sends back:
 *   - razorpay_order_id
 *   - razorpay_payment_id
 *   - razorpay_signature
 *
 * Anyone could fake these values. So Razorpay also signs the data with
 * your KEY_SECRET using HMAC-SHA256. We recreate that signature on our
 * server and compare — if they match, the payment is real.
 *
 * @returns {boolean} true if payment is genuine, false if tampered
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex")

  return expectedSignature === razorpay_signature
}

/**
 * Verifies that a webhook request actually came from Razorpay.
 *
 * @param {string|Buffer} rawBody - The raw request body (must NOT be parsed)
 * @param {string} signature - The x-razorpay-signature header value
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex")

  return expectedSignature === signature
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature }
