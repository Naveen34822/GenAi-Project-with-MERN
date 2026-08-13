const pdfParseModule = require("pdf-parse")
const pdfParse = pdfParseModule.default || pdfParseModule
const { generateAtsReport } = require("../services/ats.service")

async function generateAtsReportController(req, res) {
  try {
    const { jobDescription } = req.body

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required." })
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF is required." })
    }

    const resumeContent = await pdfParse(req.file.buffer)
    const resumeText = resumeContent.text

    const atsReport = await generateAtsReport({
      resume: resumeText,
      jobDescription
    })

    res.status(200).json({
      message: "ATS report generated successfully.",
      atsReport
    })
  } catch (err) {
    console.error("generateAtsReportController error:", err)
    res.status(500).json({ message: "Failed to generate ATS report." })
  }
}

module.exports = { generateAtsReportController }
