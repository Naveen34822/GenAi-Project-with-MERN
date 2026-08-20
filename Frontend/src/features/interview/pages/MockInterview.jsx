import React, { useState, useEffect, useRef } from 'react'
import '../style/mockInterview.scss'
import { useInterview } from '../hooks/useInterview'
import { evaluateInterviewAnswer } from '../services/interview.api'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const isSpeechSupported = !!SpeechRecognition

const MockInterview = () => {
  const { report } = useInterview()
  
  // Combine all questions from report
  const questions = [
    ...(report?.technicalQuestions || []).map(q => ({ ...q, type: 'Technical' })),
    ...(report?.behavioralQuestions || []).map(q => ({ ...q, type: 'Behavioral' }))
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState('')
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false)

  const recognitionRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if (isSpeechSupported) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setUserAnswer(prev => prev + ' ' + transcript)
      }

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      window.speechSynthesis?.cancel()
    }
  }, [])

  const currentQuestion = questions[currentIndex]

  // Handle question change
  const handleSelectQuestion = (index) => {
    setCurrentIndex(index)
    setUserAnswer('')
    setEvaluation(null)
    setError('')
    setIsPlayingSpeech(false)
    window.speechSynthesis?.cancel()
  }

  // Toggle voice recording
  const toggleRecording = () => {
    if (!isSpeechSupported) {
      alert('Speech recognition is not supported in this browser. Please try Chrome.')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Please provide or record an answer first.')
      return
    }
    setError('')
    setLoading(true)
    setEvaluation(null)

    try {
      const data = await evaluateInterviewAnswer({
        question: currentQuestion.question,
        userAnswer: userAnswer.trim(),
        intention: currentQuestion.intention,
        modelAnswer: currentQuestion.answer
      })
      setEvaluation(data.evaluation)
    } catch (err) {
      console.error(err)
      setError('Failed to evaluate response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Speak AI Answer
  const togglePlaySpeech = () => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel()
      setIsPlayingSpeech(false)
    } else {
      const text = evaluation?.betterAnswer
      if (!text) return

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => {
        setIsPlayingSpeech(false)
      }
      utterance.onerror = () => {
        setIsPlayingSpeech(false)
      }

      setIsPlayingSpeech(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="simulator-section">
        <h2>No questions available. Please generate an interview plan first.</h2>
      </div>
    )
  }

  const scoreClass =
    evaluation?.score >= 80 ? 'high' :
    evaluation?.score >= 60 ? 'mid' : 'low'

  return (
    <div className="simulator-section">
      <div className="content-header">
        <h2>Interactive Mock Interview</h2>
        <span className="content-header__count">Voice &amp; Text Practice</span>
      </div>

      <p className="simulator-section__hint">
        Select a question, record or type your answer, and receive real-time scoring, filler word analysis, and suggestions.
      </p>

      {!isSpeechSupported && (
        <div className="q-card" style={{ borderLeft: '4px solid #facc15', marginBottom: '24px' }}>
          <div className="q-card__body">
            <h3 style={{ color: '#facc15', marginBottom: '8px' }}>⚠️ Voice Input Disabled</h3>
            <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
              Your current browser does not support the Web Speech API required for voice recording. 
              You can still type your answers below, or switch to <strong>Google Chrome</strong> / <strong>Microsoft Edge</strong> on a desktop for the full experience.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="simulator-grid">
        
        {/* Left Column: Selector & Input */}
        <div className="simulator-left">
          <div className="simulator-card select-card">
            <label className="simulator-label" htmlFor="question-select">Select Question</label>
            <select
              id="question-select"
              value={currentIndex}
              onChange={(e) => handleSelectQuestion(Number(e.target.value))}
              className="simulator-select"
            >
              {questions.map((q, index) => (
                <option key={index} value={index}>
                  [{q.type}] Question {index + 1}: {q.question.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <div className="simulator-card question-card-display">
            <div className="question-header">
              <span className={`type-tag type-tag--${currentQuestion.type.toLowerCase()}`}>
                {currentQuestion.type} Question
              </span>
              <span className="index-indicator">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <p className="question-text">"{currentQuestion.question}"</p>
            {currentQuestion.intention && (
              <p className="question-intention">
                <strong>Intention:</strong> {currentQuestion.intention}
              </p>
            )}
          </div>

          <div className="simulator-card response-card">
            <label className="simulator-label" htmlFor="userAnswer">Your Answer</label>
            <textarea
              id="userAnswer"
              className="response-textarea"
              placeholder="Type your response here or use the microphone to dictate your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={8}
            />

            <div className="recording-controls">
              <button
                onClick={toggleRecording}
                disabled={!isSpeechSupported}
                className={`record-btn ${isRecording ? 'record-btn--active' : ''} ${!isSpeechSupported ? 'record-btn--disabled' : ''}`}
                title={!isSpeechSupported ? 'Browser Not Supported' : isRecording ? 'Stop Recording' : 'Start Voice Input'}
              >
                <span className="record-btn__icon">
                  {isRecording ? (
                    <span className="pulse-dot" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  )}
                </span>
                {isRecording ? 'Listening (Click to Stop)' : 'Record Answer (Voice)'}
              </button>

              <button
                onClick={() => setUserAnswer('')}
                className="clear-btn"
                disabled={!userAnswer}
              >
                Clear
              </button>
            </div>

            {error && <p className="simulator-error">{error}</p>}

            <button
              onClick={handleSubmitAnswer}
              className="button primary-button submit-answer-btn"
              disabled={loading || !userAnswer.trim()}
            >
              {loading ? 'AI Evaluating...' : 'Submit Response for Evaluation'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Feedback Dashboard */}
        <div className="simulator-right">
          {!evaluation && !loading && (
            <div className="empty-feedback-card">
              <span className="empty-icon">💡</span>
              <h3>No Evaluation Yet</h3>
              <p>Type or record your answer, then click "Submit Response" to receive detailed AI scoring, feedback, and optimization.</p>
            </div>
          )}

          {loading && (
            <div className="shimmer-feedback-card">
              <div className="shimmer-ring" />
              <div className="shimmer-line line-1" />
              <div className="shimmer-line line-2" />
              <div className="shimmer-line line-3" />
              <p>Analyzing your response structure, tone, and keywords...</p>
            </div>
          )}

          {evaluation && !loading && (
            <div className="feedback-card">
              <h3 className="feedback-title">AI Evaluation</h3>

              {/* Score ring */}
              <div className="score-summary">
                <div className={`score-ring score-ring--${scoreClass}`}>
                  <span className="score-ring__value">{evaluation.score}</span>
                  <span className="score-ring__pct">%</span>
                </div>
                <div className="score-label-wrap">
                  <p className="score-title">Performance Score</p>
                  <p className="score-grade">
                    {evaluation.score >= 80 ? '🟢 Excellent response — well structured and comprehensive' :
                     evaluation.score >= 60 ? '🟡 Good answer — can be improved with more specifics' :
                     '🔴 Weak response — misses key intentions or technical concepts'}
                  </p>
                </div>
              </div>

              {/* Filler Words */}
              <div className="feedback-section filler-words-section">
                <span className="section-title">Detected Filler Speech</span>
                {evaluation.fillerWords && evaluation.fillerWords.length > 0 ? (
                  <div className="filler-tags">
                    {evaluation.fillerWords.map((word, i) => (
                      <span key={i} className="filler-tag">"{word}"</span>
                    ))}
                    <p className="filler-note">⚠️ Note: Try to reduce these expressions during the live interview.</p>
                  </div>
                ) : (
                  <p className="no-filler-text">✅ Excellent work! No significant filler words detected.</p>
                )}
              </div>

              {/* Feedback Critique */}
              <div className="feedback-section">
                <span className="section-title">Constructive Critique</span>
                <p className="feedback-text">{evaluation.feedback}</p>
              </div>

              {/* Better Answer comparison */}
              <div className="feedback-section better-answer-section">
                <div className="better-answer-header">
                  <span className="section-title">Optimized AI Response</span>
                  <button
                    onClick={togglePlaySpeech}
                    className={`speak-btn ${isPlayingSpeech ? 'speak-btn--playing' : ''}`}
                    title={isPlayingSpeech ? 'Stop Reading' : 'Read Aloud'}
                  >
                    <span className="speak-btn__icon">
                      {isPlayingSpeech ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                      )}
                    </span>
                    {isPlayingSpeech ? 'Stop Audio' : 'Listen Answer'}
                  </button>
                </div>
                <div className="better-answer-box">
                  <p>"{evaluation.betterAnswer}"</p>
                </div>
              </div>

              {/* Next navigation */}
              {currentIndex < questions.length - 1 && (
                <button
                  onClick={() => handleSelectQuestion(currentIndex + 1)}
                  className="next-question-btn"
                >
                  Practice Next Question →
                </button>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default MockInterview
