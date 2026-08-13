const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
})

async function generateAtsReport({ resume, jobDescription }) {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.

Job Description: ${jobDescription}
Resume: ${resume}

Analyze the resume against the job description and return ONLY a JSON object with exactly these fields:
{
  "atsScore": number between 0-100,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "sectionFeedback": {
    "summary": "feedback string",
    "skills": "feedback string",
    "experience": "feedback string",
    "education": "feedback string"
  },
  "improvementTips": ["tip1", "tip2", "tip3"]
}

Rules:
- atsScore reflects how well the resume matches the JD keywords and intent
- matchedKeywords: skills/tools/terms present in BOTH resume and JD
- missingKeywords: important skills/tools/terms in JD but NOT in resume
- sectionFeedback: give specific actionable feedback per resume section
- improvementTips: 3-5 concrete bullet-point tips to improve ATS score

Return ONLY the JSON object, no extra text.`

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  })

  return JSON.parse(response.text)
}

module.exports = { generateAtsReport }
