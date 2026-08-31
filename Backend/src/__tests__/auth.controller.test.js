const request = require("supertest")

process.env.GOOGLE_CLIENT_ID = "dummy_id"
process.env.GOOGLE_CLIENT_SECRET = "dummy_secret"
process.env.JWT_SECRET = "dummy_jwt"
process.env.GOOGLE_GENAI_API_KEY = "dummy_key"

const app = require("../app")
const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blacklist.model")
const bcrypt = require("bcryptjs")

// Mock Mongoose Models
jest.mock("../models/user.model")
jest.mock("../models/blacklist.model")
jest.mock("../services/email.service") // Prevent nodemailer open handles

describe("Auth Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/auth/register", () => {
    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "test"
      })
      expect(res.statusCode).toEqual(400)
      expect(res.body.message).toBe("Please provide username, email and password")
    })

    it("should return 400 if user already exists", async () => {
      userModel.findOne.mockResolvedValueOnce({ _id: "123" }) // Mock user found
      
      const res = await request(app).post("/api/auth/register").send({
        username: "test",
        email: "test@example.com",
        password: "password123"
      })
      expect(res.statusCode).toEqual(400)
      expect(res.body.message).toBe("Account already exists with this email address or username")
    })

    it("should return 201 and token on successful registration", async () => {
      userModel.findOne.mockResolvedValueOnce(null) // Mock user not found
      userModel.create.mockResolvedValueOnce({
        _id: "123",
        username: "test",
        email: "test@example.com",
        role: "user"
      })
      
      const res = await request(app).post("/api/auth/register").send({
        username: "test",
        email: "test@example.com",
        password: "password123"
      })
      
      expect(res.statusCode).toEqual(201)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe("test")
    })
  })

  describe("POST /api/auth/login", () => {
    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com"
      })
      expect(res.statusCode).toEqual(400)
    })

    it("should return 400 if user not found", async () => {
      userModel.findOne.mockResolvedValueOnce(null)
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123"
      })
      expect(res.statusCode).toEqual(400)
      expect(res.body.message).toBe("Invalid email or password")
    })

    it("should return 200 and token on success", async () => {
      // Create a mock user with a valid hashed password (or mock bcrypt.compare)
      const mockUser = {
        _id: "123",
        email: "test@example.com",
        password: "hashedpassword",
        role: "user"
      }
      userModel.findOne.mockResolvedValueOnce(mockUser)
      
      // Mock bcrypt.compare to return true
      jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true)
      
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123"
      })
      
      expect(res.statusCode).toEqual(200)
      expect(res.body.token).toBeDefined()
    })
  })

  describe("GET /api/auth/logout", () => {
    it("should clear cookie and blacklist token", async () => {
      tokenBlacklistModel.create.mockResolvedValueOnce({})
      
      // Send dummy token in cookie
      const res = await request(app)
        .get("/api/auth/logout")
        .set("Cookie", ["token=dummy_token"])
        
      expect(res.statusCode).toEqual(200)
      expect(res.body.message).toBe("User logged out successfully")
      expect(tokenBlacklistModel.create).toHaveBeenCalledWith({ token: "dummy_token" })
    })
  })
})
