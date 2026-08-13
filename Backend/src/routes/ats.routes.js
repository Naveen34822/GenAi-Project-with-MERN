const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const atsController = require("../controllers/ats.controller")
const upload = require("../middlewares/file.middleware")

const atsRouter = express.Router()

/**
 * @route POST /api/ats/
 * @description Generate ATS score by comparing resume PDF against job description.
 * @access private
 */
atsRouter.post("/", authMiddleware.authUser, upload.single("resume"), atsController.generateAtsReportController)

module.exports = atsRouter
