import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.DEV ? "http://localhost:5050" : "https://genai-project-with-mern.onrender.com",
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription || "")
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to evaluate mock interview question answer.
 */
export const evaluateInterviewAnswer = async ({ question, userAnswer, intention, modelAnswer }) => {
    const response = await api.post("/api/interview/evaluate", { question, userAnswer, intention, modelAnswer })
    return response.data
}

/**
 * @description Service to send conversation history and get AI's follow-up voice-call reply.
 */
export const generateLiveVoiceChatReply = async ({ history, jobDescription, resume }) => {
    const response = await api.post("/api/interview/chat", { history, jobDescription, resume })
    return response.data
}

/**
 * @description Service to send the full interview transcript to the user via email
 */
export const sendTranscriptEmail = async ({ transcript, role }) => {
    const response = await api.post("/api/interview/send-transcript", { transcript, role })
    return response.data
}
