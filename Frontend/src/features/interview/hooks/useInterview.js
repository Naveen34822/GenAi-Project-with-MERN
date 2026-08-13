import { getAllInterviewReports, generateInterviewReport, getInterviewReportById } from "../services/interview.api"
import { useContext, useEffect, useCallback } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {
  const context = useContext(InterviewContext)
  const { interviewId } = useParams()

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider")
  }

  const { loading, setLoading, report, setReport, reports, setReports } = context

  const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true)
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile
      })
      setReport(response.interviewReport)
      return response.interviewReport
    } catch (error) {
      console.error("generateReport error:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setReport])

  const getReportById = useCallback(async (interviewId) => {
    setLoading(true)
    try {
      const response = await getInterviewReportById(interviewId)
      setReport(response.interviewReport)
      return response.interviewReport
    } catch (error) {
      console.error("getReportById error:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setReport])

  const getReports = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAllInterviewReports()
      setReports(response.interviewReports)
      return response.interviewReports
    } catch (error) {
      console.error("getReports error:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setReports])

  useEffect(() => {
    if (interviewId) {
      if (!report || report._id !== interviewId) {
        getReportById(interviewId)
      }
    } else {
      if (!reports || reports.length === 0) {
        getReports()
      }
    }
  }, [interviewId, report, reports, getReportById, getReports])

  return { loading, report, reports, generateReport, getReportById, getReports }
}
