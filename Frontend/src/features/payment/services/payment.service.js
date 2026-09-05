import axios from "axios"

// Base URL — uses Vite proxy in dev, direct URL in prod
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050"

/**
 * Step 1: Ask the backend to create a Razorpay order.
 * Returns: { order_id, amount, currency }
 *
 * The backend calls Razorpay API and creates an order.
 * We send that order_id to the Razorpay checkout popup.
 */
export async function createOrder() {
  const response = await axios.post(
    `${BASE_URL}/api/payment/create-order`,
    {},
    { withCredentials: true } // send JWT cookie
  )
  return response.data
}

/**
 * Step 2: After user pays, verify the payment with backend.
 * Sends the 3 IDs Razorpay gives us after payment.
 *
 * Backend verifies the signature and upgrades user to Pro.
 */
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const response = await axios.post(
    `${BASE_URL}/api/payment/verify`,
    { razorpay_order_id, razorpay_payment_id, razorpay_signature },
    { withCredentials: true }
  )
  return response.data
}

/**
 * Get the current user's plan status.
 * Returns: { plan, planExpiresAt, interviewsThisMonth, freeLimit }
 */
export async function getPaymentStatus() {
  const response = await axios.get(
    `${BASE_URL}/api/payment/status`,
    { withCredentials: true }
  )
  return response.data
}
