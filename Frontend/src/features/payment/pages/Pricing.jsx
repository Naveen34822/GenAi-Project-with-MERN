import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { createOrder, verifyPayment } from '../services/payment.service'
import toast from 'react-hot-toast'
import '../style/pricing.scss'

const Pricing = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  /**
   * THE FULL RAZORPAY CHECKOUT FLOW — 3 steps:
   *
   * Step 1: Call our backend → creates a Razorpay order → we get order_id
   * Step 2: Open Razorpay popup → user pays with card/UPI
   * Step 3: On success, Razorpay gives us 3 IDs → we send them to backend to verify
   */
  const handleUpgrade = async () => {
    setLoading(true)
    const toastId = toast.loading('Setting up payment...')

    try {
      // ── STEP 1: Create Order ─────────────────────────────────────────────
      // Ask our backend to create a Razorpay order
      // Backend returns: { order_id, amount, currency }
      const orderData = await createOrder()

      toast.loading('Opening payment gateway...', { id: toastId })

      // ── STEP 2: Open Razorpay Checkout Popup ────────────────────────────
      // window.Razorpay is available because we added the script in index.html
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // your KEY_ID (safe for frontend)
        amount: orderData.amount,                   // amount in paise (from backend)
        currency: orderData.currency,               // "INR"
        order_id: orderData.order_id,               // the order we just created
        name: "Hirelens",
        description: "Pro Plan — Unlimited Interviews",
        image: "https://via.placeholder.com/150/6c63ff/ffffff?text=H", // your logo

        // ── STEP 3: Payment Success Handler ─────────────────────────────
        // Razorpay calls this function when the user successfully pays.
        // It gives us 3 IDs — we must send these to our backend to verify.
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: toastId })

            // Send all 3 IDs to backend for signature verification
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            // Payment verified and user upgraded to Pro!
            toast.success('🎉 Welcome to Pro! Enjoy unlimited interviews.', { id: toastId })

            // Redirect to home after a short delay
            setTimeout(() => navigate('/'), 1500)

          } catch (verifyErr) {
            toast.error('Payment verification failed. Contact support.', { id: toastId })
            console.error('Verification error:', verifyErr)
          }
        },

        // Pre-fill user details (optional — Razorpay will auto-fill in popup)
        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#6c63ff" // your brand color
        },

        // Called if user CLOSES the payment popup without paying
        modal: {
          ondismiss: function () {
            toast.dismiss(toastId)
            toast.error('Payment cancelled.')
            setLoading(false)
          }
        }
      }

      // Open the Razorpay checkout popup
      const rzp = new window.Razorpay(options)

      // Handle payment failure inside the popup (e.g. wrong card details)
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`, { id: toastId })
        setLoading(false)
      })

      rzp.open()

    } catch (err) {
      console.error('handleUpgrade error:', err)
      toast.error('Failed to initiate payment. Please try again.', { id: toastId })
      setLoading(false)
    }
  }

  return (
    <div className="pricing-page">
      {/* Header */}
      <header className="pricing-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="pricing-badge">Simple Pricing</div>
        <h1>Choose Your <span className="gradient-text">Interview Plan</span></h1>
        <p className="pricing-subtitle">
          Start free, upgrade when you're ready to go all-in.
        </p>
      </header>

      {/* Plans */}
      <div className="plans-container">

        {/* Free Plan */}
        <div className="plan-card plan-card--free">
          <div className="plan-header">
            <div className="plan-icon">🆓</div>
            <h2>Free</h2>
            <div className="plan-price">
              <span className="price-amount">₹0</span>
              <span className="price-period">/month</span>
            </div>
            <p className="plan-tagline">Perfect to get started</p>
          </div>

          <ul className="plan-features">
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>3 AI Interview Reports / 30 days</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>ATS Resume Score (1/week)</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>View all past reports</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>Email report delivery</span>
            </li>
            <li className="feature feature--excluded">
              <span className="feature-icon">✗</span>
              <span>Live Voice Call Interview</span>
            </li>
            <li className="feature feature--excluded">
              <span className="feature-icon">✗</span>
              <span>Video Interview with AI Feedback</span>
            </li>
            <li className="feature feature--excluded">
              <span className="feature-icon">✗</span>
              <span>Unlimited Reports</span>
            </li>
          </ul>

          <button className="plan-btn plan-btn--free" onClick={() => navigate('/')}>
            Continue with Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="plan-card plan-card--pro">
          <div className="popular-badge">⚡ Most Popular</div>

          <div className="plan-header">
            <div className="plan-icon">💎</div>
            <h2>Pro</h2>
            <div className="plan-price">
              <span className="price-amount">₹299</span>
              <span className="price-period">/month</span>
            </div>
            <p className="plan-tagline">For serious job seekers</p>
          </div>

          <ul className="plan-features">
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span><strong>Unlimited</strong> AI Interview Reports</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span><strong>Unlimited</strong> ATS Resume Scans</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>🎙️ Live Voice Call Interview</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>🎥 Video Interview with AI Feedback</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>Answer Evaluation (per question)</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>Interview Transcript via Email</span>
            </li>
            <li className="feature feature--included">
              <span className="feature-icon">✓</span>
              <span>Priority AI Responses</span>
            </li>
          </ul>

          <button
            className="plan-btn plan-btn--pro"
            onClick={handleUpgrade}
            disabled={loading}
            id="upgrade-to-pro-btn"
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : (
              '⚡ Upgrade to Pro — ₹299/month'
            )}
          </button>

          <p className="plan-note">
            🔒 Secure payment via Razorpay · Cancel anytime
          </p>
        </div>
      </div>

      {/* Test Mode Notice */}
      <div className="test-notice">
        <span>🧪</span>
        <div>
          <strong>Test Mode Active</strong>
          <p>Use card <code>4111 1111 1111 1111</code>, any future date, any CVV to test payment.</p>
        </div>
      </div>

      {/* FAQ */}
      <section className="pricing-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Yes! Cancel from your dashboard anytime. Your Pro access continues until the end of the billing period.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods are accepted?</h4>
            <p>Credit/Debit cards, UPI (GPay, PhonePe), Netbanking, and Wallets via Razorpay.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data safe?</h4>
            <p>Yes. We never store your card details. All payments are processed securely by Razorpay.</p>
          </div>
          <div className="faq-item">
            <h4>What happens when free limit resets?</h4>
            <p>Free tier limits (3 reports/month) reset on the 1st of every calendar month automatically.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pricing
