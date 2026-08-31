const request = require("supertest")

process.env.GOOGLE_CLIENT_ID = "dummy_id"
process.env.GOOGLE_CLIENT_SECRET = "dummy_secret"
process.env.JWT_SECRET = "dummy_jwt"
process.env.GOOGLE_GENAI_API_KEY = "dummy_key"

const app = require("../app")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blacklist.model")
const jwt = require("jsonwebtoken")
const { generateInterviewReport } = require("../services/ai.service")

// Mock Models and Services
jest.mock("../models/interviewReport.model")
jest.mock("../models/user.model")
jest.mock("../models/blacklist.model")
jest.mock("../services/ai.service")
jest.mock("../services/email.service") // Prevent nodemailer open handles

// Create a valid token to bypass auth middleware
const mockToken = jwt.sign({ id: "user123" }, process.env.JWT_SECRET)

describe("Interview Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    userModel.findById.mockResolvedValue({ _id: "user123", email: "test@example.com" })
    tokenBlacklistModel.findOne.mockResolvedValue(null) // Mock token not blacklisted
  })

  describe("POST /api/interview/", () => {
    it("should return 400 if jobDescription is missing", async () => {
      const res = await request(app)
        .post("/api/interview/")
        .set("Authorization", `Bearer ${mockToken}`)
        .field("title", "SDE")
        .field("selfDescription", "I am a dev")
      
      expect(res.statusCode).toEqual(400)
    })

    it("should return 201 on success", async () => {
      generateInterviewReport.mockResolvedValueOnce({
        matchScore: 85,
        technicalQuestions: [],
        behavioralQuestions: []
      })

      interviewReportModel.create.mockResolvedValueOnce({ _id: "report123" })

      const res = await request(app)
        .post("/api/interview/")
        .set("Authorization", `Bearer ${mockToken}`)
        .field("title", "SDE")
        .field("jobDescription", "Required skills: React, Node")
        .field("selfDescription", "I am a dev")
      
      expect(res.statusCode).toEqual(201)
      expect(res.body.message).toBe("Interview report generated successfully.")
      expect(interviewReportModel.create).toHaveBeenCalled()
    })
  })

  describe("GET /api/interview/", () => {
    it("should return list of reports", async () => {
      const mockReports = [{ _id: "r1", title: "SDE 1" }, { _id: "r2", title: "SDE 2" }]
      
      // Mongoose chaining mock (find -> sort -> select)
      interviewReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockReports)
      })

      const res = await request(app)
        .get("/api/interview/")
        .set("Authorization", `Bearer ${mockToken}`)
      
      expect(res.statusCode).toEqual(200)
      expect(res.body.interviewReports.length).toBe(2)
    })
  })
})
