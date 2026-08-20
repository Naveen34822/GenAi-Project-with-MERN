const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const passport = require("./config/passport")

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

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const atsRouter = require("./routes/ats.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/ats", atsRouter)

module.exports = app