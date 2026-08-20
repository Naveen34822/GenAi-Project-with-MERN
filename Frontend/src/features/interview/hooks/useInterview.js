import { useEffect, useRef } from "react"
import { useParams } from "react-router"
import { useInterviewStore } from "../store/useInterviewStore"

export const useInterview = () => {
  const { interviewId } = useParams()

  // Select all state and actions from the Zustand store
  const {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports
  } = useInterviewStore()

  // Prevents fetching twice in React StrictMode and prevents infinite loop
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    if (interviewId) {
      // On the interview detail page — fetch that specific report
      if (!report || report._id !== interviewId) {
        getReportById(interviewId).catch(console.error)
      }
    } else {
      // On the home page — fetch all reports (runs only once)
      getReports().catch(console.error)
    }
  }, [interviewId, getReportById, getReports, report])

  return { loading, report, reports, generateReport, getReportById, getReports }
}
