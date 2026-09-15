const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const passport = require("./config/passport")
const rateLimit = require("express-rate-limit")

const app = express()
app.set("trust proxy", 1) // Required for rate limiting behind Render/Vercel proxies

// ── Razorpay Webhook: MUST use express.raw() BEFORE express.json() ───────────
// Razorpay verifies webhooks using the RAW request body.
// If express.json() parses the body first, the signature check will FAIL.
// So we intercept this specific route with raw body parsing.
app.use("/api/payment/webhook", express.raw({ type: "application/json" }))

app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize()) // initialize passport (no sessions needed — we use JWT)

const allowedOrigins = [
  "https://gen-ai-project-with-mern.vercel.app"
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
    if (isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // required for cookies to be sent cross-origin
}))

// ── Rate Limiting ──────────────────────────────────────────────────────────────
// General API limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
})

// Stricter limiter for auth endpoints: 30 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register attempts, please try again later." }
})

// AI endpoint limiter: 20 requests per 15 minutes (protects Gemini API quota)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI request limit reached. Please wait before trying again." }
})

app.use("/api/", generalLimiter)

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const atsRouter = require("./routes/ats.routes")
const paymentRouter = require("./routes/payment.routes")

app.use("/api/auth", authLimiter, authRouter)
app.use("/api/interview", aiLimiter, interviewRouter)
app.use("/api/ats", aiLimiter, atsRouter)
app.use("/api/payment", paymentRouter)

// ── Temporary Diagnostic: Test Email on Deployed Server ───────────────────────
// Hit GET /api/test-email to see the exact SMTP error on Render
// REMOVE THIS after debugging!
app.get("/api/test-email", async (req, res) => {
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const data = await resend.emails.send({
        from: 'Hirelens <onboarding@resend.dev>',
        to: process.env.SMTP_USER || 'delivered@resend.dev',
        subject: "Hirelens Deployed Email Test (Resend)",
        html: "<h1>Email works from Render!</h1><p>If you see this, Resend HTTP API is working.</p>"
      })
      return res.json({ success: true, method: "Resend", data })
    }

    const nodemailer = require("nodemailer")
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!user || !pass) {
      return res.json({
        error: "RESEND_API_KEY not set. SMTP_USER or SMTP_PASS not set either.",
        SMTP_USER: user ? "SET" : "MISSING",
        SMTP_PASS: pass ? "SET" : "MISSING",
        RESEND_API_KEY: "MISSING"
      })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    })

    await transporter.verify()

    const info = await transporter.sendMail({
      from: `"Hirelens Test" <${user}>`,
      to: user,
      subject: "Hirelens Deployed Email Test (SMTP)",
      html: "<h1>Email works from Render!</h1><p>If you see this, SMTP is working on the deployed server.</p>"
    })

    res.json({ success: true, method: "SMTP", messageId: info.messageId })
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      code: err.code,
      command: err.command,
      fullError: err.toString()
    })
  }
})

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err)
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error"
  })
})

module.exports = app