const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

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
 * @description Send conversation history and get AI follow up response
 * @access private
 */
interviewRouter.post("/chat", authMiddleware.authUser, interviewController.generateLiveChatReplyController)

module.exports = interviewRouter
