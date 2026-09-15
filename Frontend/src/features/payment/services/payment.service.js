import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:5050" : "https://genai-project-with-mern.onrender.com",
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Step 1: Ask the backend to create a Razorpay order.
 * Returns: { order_id, amount, currency }
 *
 * The backend calls Razorpay API and creates an order.
 * We send that order_id to the Razorpay checkout popup.
 */
export async function createOrder() {
  const response = await api.post("/api/payment/create-order")
  return response.data
}

/**
 * Step 2: After user pays, verify the payment with backend.
 * Sends the 3 IDs Razorpay gives us after payment.
 *
 * Backend verifies the signature and upgrades user to Pro.
 */
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const response = await api.post("/api/payment/verify", { razorpay_order_id, razorpay_payment_id, razorpay_signature })
  return response.data
}

/**
 * Get the current user's plan status.
 * Returns: { plan, planExpiresAt, interviewsThisMonth, freeLimit }
 */
export async function getPaymentStatus() {
  const response = await api.get("/api/payment/status")
  return response.data
}
