const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")
const { checkFreeLimit, requirePro } = require("../middlewares/plan.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private (Free: max 3/month | Pro: unlimited)
 */
interviewRouter.post("/", authMiddleware.authUser, checkFreeLimit, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route POST /api/interview/evaluate
 * @description Evaluate user's answer to a mock interview question
 * @access private
 */
interviewRouter.post("/evaluate", authMiddleware.authUser, interviewController.evaluateAnswerController)

/**
 * @route POST /api/interview/chat
 * @description Send conversation history and get AI follow up response (Pro only — used in Live Voice & Video Interview)
 * @access private (Pro only)
 */
interviewRouter.post("/chat", authMiddleware.authUser, requirePro, interviewController.generateLiveChatReplyController)

/**
 * @route POST /api/interview/send-transcript
 * @description Send full interview transcript to the user's email
 * @access private
 */
interviewRouter.post("/send-transcript", authMiddleware.authUser, interviewController.sendTranscriptEmailController)

module.exports = interviewRouter
