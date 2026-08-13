import React, { useState } from 'react'
import '../style/ats.scss'
import { generateAtsReport } from '../services/ats.api'
import { useInterview } from '../hooks/useInterview'

const AtsScore = () => {
  const { report } = useInterview()

  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState(report?.jobDescription || '')
  const [atsReport, setAtsReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!jobDescription.trim()) return setError('Job description is required.')
    if (!resumeFile) return setError('Please upload your resume PDF.')
    setError('')
    setLoading(true)
    try {
      const data = await generateAtsReport({ jobDescription, resumeFile })
      setAtsReport(data.atsReport)
    } catch {
      setError('Failed to generate ATS report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scoreClass =
    atsReport?.atsScore >= 80 ? 'high' :
    atsReport?.atsScore >= 60 ? 'mid' : 'low'

  return (
    <div className='ats-section'>
      {!atsReport ? (
        <div className='ats-form'>
          <div className='content-header'>
            <h2>ATS Score Checker</h2>
            <span className='content-header__count'>Keyword Analysis</span>
          </div>

          <p className='ats-form__hint'>
            Upload your resume and paste the job description to see how well you match the ATS filters.
          </p>

          <div className='ats-form__field'>
            <label className='ats-form__label'>Resume PDF</label>
            <label className='ats-form__file-drop'>
              <input
                type='file'
                accept='application/pdf'
                onChange={e => setResumeFile(e.target.files[0])}
              />
              {resumeFile
                ? <span className='ats-form__file-name'>📄 {resumeFile.name}</span>
                : <span>Click to upload PDF</span>
              }
            </label>
          </div>

          <div className='ats-form__field'>
            <label className='ats-form__label'>Job Description</label>
            <textarea
              className='ats-form__textarea'
              rows={8}
              placeholder='Paste the job description here...'
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>

          {error && <p className='ats-form__error'>{error}</p>}

          <button
            className='button primary-button'
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze ATS Score'}
          </button>
        </div>
      ) : (
        <div className='ats-result'>
          <div className='content-header'>
            <h2>ATS Analysis</h2>
            <button
              className='ats-result__reset'
              onClick={() => setAtsReport(null)}
            >
              ← Re-analyze
            </button>
          </div>

          <div className='ats-score-ring-wrap'>
            <div className={`ats-score-ring ats-score-ring--${scoreClass}`}>
              <span className='ats-score-ring__value'>{atsReport.atsScore}</span>
              <span className='ats-score-ring__pct'>%</span>
            </div>
            <div className='ats-score-ring-wrap__info'>
              <p className='ats-score-ring-wrap__label'>ATS Score</p>
              <p className='ats-score-ring-wrap__sub'>
                {atsReport.atsScore >= 80
                  ? '🟢 Strong match — your resume is well-optimized'
                  : atsReport.atsScore >= 60
                    ? '🟡 Moderate match — a few gaps to address'
                    : '🔴 Weak match — significant keywords missing'}
              </p>
            </div>
          </div>

          <div className='ats-keywords'>
            <div className='ats-keywords__group'>
              <p className='ats-keywords__label ats-keywords__label--matched'>
                ✅ Matched Keywords ({atsReport.matchedKeywords.length})
              </p>
              <div className='ats-keywords__tags'>
                {atsReport.matchedKeywords.map((kw, i) => (
                  <span key={i} className='ats-kw-tag ats-kw-tag--matched'>{kw}</span>
                ))}
              </div>
            </div>
            <div className='ats-keywords__group'>
              <p className='ats-keywords__label ats-keywords__label--missing'>
                ❌ Missing Keywords ({atsReport.missingKeywords.length})
              </p>
              <div className='ats-keywords__tags'>
                {atsReport.missingKeywords.map((kw, i) => (
                  <span key={i} className='ats-kw-tag ats-kw-tag--missing'>{kw}</span>
                ))}
              </div>
            </div>
          </div>

          <div className='ats-feedback'>
            <p className='ats-feedback__heading'>Section Feedback</p>
            {Object.entries(atsReport.sectionFeedback).map(([section, feedback]) => (
              <div key={section} className='ats-feedback__item'>
                <span className='ats-feedback__section'>{section}</span>
                <p className='ats-feedback__text'>{feedback}</p>
              </div>
            ))}
          </div>

          <div className='ats-tips'>
            <p className='ats-tips__heading'>💡 Improvement Tips</p>
            <ul className='ats-tips__list'>
              {atsReport.improvementTips.map((tip, i) => (
                <li key={i}>
                  <span className='ats-tips__bullet' />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default AtsScore
