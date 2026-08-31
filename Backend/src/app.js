const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const passport = require("./config/passport")
const rateLimit = require("express-rate-limit")

const app = express()

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

// Stricter limiter for auth endpoints: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

app.use("/api/auth", authLimiter, authRouter)
app.use("/api/interview", aiLimiter, interviewRouter)
app.use("/api/ats", aiLimiter, atsRouter)

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err)
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error"
  })
})

module.exports = app