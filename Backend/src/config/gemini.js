const { GoogleGenAI } = require("@google/genai")

// Shared Gemini AI client — single instance used by all services
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
})

module.exports = ai
