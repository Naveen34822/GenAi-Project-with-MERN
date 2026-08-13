const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  const prompt = `You are an expert interview coach. Generate an interview report as a JSON object.

Job Description: ${jobDescription}
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}

Return ONLY a JSON object with exactly these fields:
{
  "title": "job title string",
  "matchScore": number between 0-100,
  "technicalQuestions": [
    {
      "question": "question string",
      "intention": "intention string",
      "answer": "answer string"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "question string",
      "intention": "intention string",
      "answer": "answer string"
    }
  ],
  "skillGaps": [
    {
      "skill": "skill string",
      "severity": "low" or "medium" or "high"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "focus string",
      "tasks": ["task1", "task2"]
    }
  ]
}

Generate at least 5 technical questions, 5 behavioral questions, a comprehensive list of all identified skill gaps, and a 7 day preparation plan.
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

async function evaluateAnswer({ question, userAnswer, intention, modelAnswer }) {
  const prompt = `You are an expert interviewer. Evaluate the candidate's response to the following interview question.

Question: ${question}
Question Intention: ${intention || "Not provided"}
Expected Reference Answer: ${modelAnswer || "Not provided"}
Candidate's Response: ${userAnswer}

Analyze the response and return ONLY a JSON object with exactly these fields:
{
  "score": number between 0-100 representing response quality,
  "feedback": "detailed constructive feedback listing what they did well and where they can improve",
  "fillerWords": ["list", "of", "detected", "filler", "words", "like", "um", "uh", "like", "so"],
  "betterAnswer": "a highly polished, professional model version of their response incorporating their experience"
}

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

async function generateLiveChatReply({ history, jobDescription, resume }) {
  const systemInstruction = `You are a professional hiring manager conducting a live voice mock interview.
Job Description: ${jobDescription}
Candidate Resume: ${resume || "Not provided"}

Rules:
- Keep your responses short, conversational, and natural (1-3 sentences maximum). This is a voice call.
- Ask one question at a time.
- React briefly to the candidate's answer, then ask a follow-up or the next question.
- Do NOT output any markdown, asterisks, or bullet points. Return clean, plain text suitable for text-to-speech.`

  const contents = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }]
  }))

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 150
    }
  })

  return response.text
}

module.exports = { generateInterviewReport, evaluateAnswer, generateLiveChatReply }
