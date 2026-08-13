import axios from "axios"

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
 * @description Generate ATS score by comparing resume PDF against job description.
 */
export const generateAtsReport = async ({ jobDescription, resumeFile }) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/ats/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })

    return response.data
}
