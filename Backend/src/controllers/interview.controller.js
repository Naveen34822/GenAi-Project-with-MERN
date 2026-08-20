const pdfParseModule = require("pdf-parse")
const pdfParse = pdfParseModule.default || pdfParseModule
const { generateInterviewReport, evaluateAnswer, generateLiveChatReply } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const { sendInterviewReportEmail } = require("../services/email.service")

async function generateInterViewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required." })
    }

    // ✅ FIX: both resume and selfDescription are optional
    // but at least one must be provided
    if (!req.file && !selfDescription) {
      return res.status(400).json({
        message: "Please provide either a resume PDF or a self description."
      })
    }

    // ✅ FIX: only parse PDF if file was uploaded
    let resumeText = ""
    if (req.file) {
      const resumeContent = await pdfParse(req.file.buffer)
      resumeText = resumeContent.text
    }

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription
    })

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
      ...interViewReportByAi
    })

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport
    })

    // 🔥 Send email notification in the background
    // We don't await this because we don't want to block the HTTP response!
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    const reportLink = `${frontendUrl}/interview/${interviewReport._id}`
    const userName = req.user.username || req.user.email.split('@')[0]
    
    sendInterviewReportEmail(
      req.user.email,
      userName,
      interviewReport.jobPosition || "Software Engineer",
      interviewReport.matchScore || 0,
      reportLink
    ).catch(e => console.error("Background email failed:", e))
  } catch (err) {
    console.error("generateInterViewReportController error:", err)
    res.status(500).json({ message: "Failed to generate interview report." })
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    })

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." })
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport
    })
  } catch (err) {
    console.error("getInterviewReportByIdController error:", err)
    res.status(500).json({ message: "Failed to fetch interview report." })
  }
}

async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports
    })
  } catch (err) {
    console.error("getAllInterviewReportsController error:", err)
    res.status(500).json({ message: "Failed to fetch interview reports." })
  }
}

async function evaluateAnswerController(req, res) {
  try {
    const { question, userAnswer, intention, modelAnswer } = req.body

    if (!question || !userAnswer) {
      return res.status(400).json({ message: "Question and User Answer are required." })
    }

    const evaluation = await evaluateAnswer({ question, userAnswer, intention, modelAnswer })

    res.status(200).json({
      message: "Answer evaluated successfully.",
      evaluation
    })
  } catch (err) {
    console.error("evaluateAnswerController error:", err)
    res.status(500).json({ message: "Failed to evaluate answer." })
  }
}

async function generateLiveChatReplyController(req, res) {
  try {
    const { history, jobDescription, resume } = req.body

    if (!history || !Array.isArray(history) || !jobDescription) {
      return res.status(400).json({ message: "History array and Job Description are required." })
    }

    const reply = await generateLiveChatReply({ history, jobDescription, resume })

    res.status(200).json({
      message: "Chat reply generated successfully.",
      reply
    })
  } catch (err) {
    console.error("generateLiveChatReplyController error:", err)
    res.status(500).json({ message: "Failed to generate chat reply." })
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  evaluateAnswerController,
  generateLiveChatReplyController
}
