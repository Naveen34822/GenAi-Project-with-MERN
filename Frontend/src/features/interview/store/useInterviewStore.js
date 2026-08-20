import { create } from 'zustand'
import { getAllInterviewReports, generateInterviewReport, getInterviewReportById } from '../services/interview.api'

// Helper function to create a timeout promise
const withTimeout = (promise, ms = 20000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms / 1000} seconds. The AI might be overloaded.`));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const useInterviewStore = create((set) => ({
  loading: false,
  report: null,
  reports: [],

  setLoading: (loading) => set({ loading }),
  setReport: (report) => set({ report }),
  setReports: (reports) => set({ reports }),

  generateReport: async ({ jobDescription, selfDescription, resumeFile }) => {
    set({ loading: true });
    try {
      const response = await withTimeout(
        generateInterviewReport({ jobDescription, selfDescription, resumeFile }),
        20000 // 20s timeout
      );
      set({ report: response.interviewReport, loading: false });
      return response.interviewReport;
    } catch (error) {
      console.error("generateReport error:", error);
      set({ loading: false });
      throw error; // Rethrow to let the UI catch and show the timeout/error
    }
  },

  getReportById: async (id) => {
    set({ loading: true });
    try {
      const response = await withTimeout(getInterviewReportById(id), 10000); // 10s timeout for fetching
      set({ report: response.interviewReport, loading: false });
      return response.interviewReport;
    } catch (error) {
      console.error("getReportById error:", error);
      set({ loading: false });
      throw error;
    }
  },

  getReports: async () => {
    set({ loading: true });
    try {
      const response = await withTimeout(getAllInterviewReports(), 10000); // 10s timeout for fetching
      set({ reports: response.interviewReports || [], loading: false });
      return response.interviewReports;
    } catch (error) {
      console.error("getReports error:", error);
      set({ reports: [], loading: false });
      throw error;
    }
  }
}));
