const pdfParseModule = require("pdf-parse")
const pdfParse = pdfParseModule.default || pdfParseModule
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

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

async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." })
    }

    const { resume, jobDescription, selfDescription } = interviewReport
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
  } catch (err) {
    console.error("generateResumePdfController error:", err)
    res.status(500).json({ message: "Failed to generate resume PDF." })
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController
}