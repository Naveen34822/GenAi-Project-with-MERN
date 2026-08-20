import React, { useState, useEffect, useRef, useCallback } from 'react'
import '../style/liveVoiceCall.scss'
import { useInterview } from '../hooks/useInterview'
import { generateLiveVoiceChatReply, evaluateInterviewAnswer } from '../services/interview.api'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const isSpeechSupported = !!SpeechRecognition

const LiveVoiceCall = () => {
  const { report } = useInterview()
  
  const [status, setStatus] = useState('idle') // 'idle' | 'calling' | 'connected' | 'ended'
  const [timer, setTimer] = useState(0)
  const [history, setHistory] = useState([])
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentSpeechText, setCurrentSpeechText] = useState('')
  const [aiSubtitle, setAiSubtitle] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const historyRef = useRef([])
  const statusRef = useRef(status)
  const silenceTimerRef = useRef(null)    // fires submit after N seconds of silence
  const lastSpeechTextRef = useRef('')   // latest transcript for silence timer callback

  // Keep historyRef in sync for callbacks
  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Timer Effect
  useEffect(() => {
    let interval = null
    if (status === 'connected') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } else {
      setTimer(0)
    }
    return () => clearInterval(interval)
  }, [status])

  // Silence-based auto-submit: fires after SILENCE_DELAY ms of no new speech
  const SILENCE_DELAY = 4000 // 4 seconds — enough time for natural pauses

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback((text) => {
    clearSilenceTimer()
    if (!text.trim()) return
    silenceTimerRef.current = setTimeout(() => {
      // Auto-submit after silence if we have text and are still listening
      if (lastSpeechTextRef.current.trim() && statusRef.current === 'connected') {
        if (recognitionRef.current) recognitionRef.current.stop()
        handleUserAnswerSubmitted(lastSpeechTextRef.current.trim())
      }
    }, SILENCE_DELAY)
  }, [clearSilenceTimer]) // handleUserAnswerSubmitted added below

  // Initialize Speech Recognition
  useEffect(() => {
    if (isSpeechSupported) {
      const rec = new SpeechRecognition()
      rec.continuous = true      // Keep listening through natural pauses
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsListening(true)
        setCurrentSpeechText('')
        setAiSubtitle('')
      }

      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        setCurrentSpeechText(transcript)
        lastSpeechTextRef.current = transcript
        // Reset silence timer every time new speech comes in
        startSilenceTimer(transcript)
      }

      rec.onerror = (event) => {
        if (event.error === 'no-speech') return // ignore no-speech, keep running
        console.error('Speech recognition error in call:', event.error)
        setIsListening(false)
      }

      rec.onend = () => {
        // continuous=true recognition can still end (e.g. after ~60s or on error)
        // Restart it if we're still in a listening state
        if (statusRef.current === 'connected') {
          try { rec.start() } catch(e) { /* already running */ }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = rec
    }

    return () => {
      clearSilenceTimer()
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [startSilenceTimer, clearSilenceTimer])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
  }

  // Speak AI response and trigger recognition on completion
  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel() // clear any queue
    setIsAiSpeaking(true)
    setAiSubtitle(text)

    const utterance = new SpeechSynthesisUtterance(text)
    
    utterance.onend = () => {
      setIsAiSpeaking(false)
      // Automatically open the user's mic to answer
      if (statusRef.current === 'connected' && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.log('Recognition already running or failed to start:', e)
        }
      }
    }

    utterance.onerror = (e) => {
      console.error('Utterance speech synthesis error:', e)
      setIsAiSpeaking(false)
      setAiSubtitle('')
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  // Start Voice Call
  const handleStartCall = () => {
    if (!isSpeechSupported) {
      alert('Speech tools are not supported in your browser. Please use Google Chrome.')
      return
    }
    setError('')
    setEvaluation(null)
    setHistory([])
    setAiSubtitle('')
    setCurrentSpeechText('')
    setStatus('calling')

    // Simulate Ringing delay
    setTimeout(() => {
      setStatus('connected')
      const initialGreeting = `Hello! Welcome to your live voice interview for the ${report?.title || 'position'}. I will be your interviewer today. To start off, could you please introduce yourself and outline your experience?`
      
      const greetingMsg = { role: 'model', text: initialGreeting }
      setHistory([greetingMsg])
      speakText(initialGreeting)
    }, 2500)
  }

  // Handle User Response
  const handleUserAnswerSubmitted = useCallback(async (text) => {
    const userMsg = { role: 'user', text }
    const updatedHistory = [...historyRef.current, userMsg]
    setHistory(updatedHistory)
    setCurrentSpeechText('')
    setAiSubtitle('')

    try {
      setIsGeneratingReply(true)
      const data = await generateLiveVoiceChatReply({
        history: updatedHistory,
        jobDescription: report?.jobDescription || '',
        resume: report?.resume || ''
      })

      const aiMsg = { role: 'model', text: data.reply }
      setHistory(prev => [...prev, aiMsg])
      speakText(data.reply)
    } catch (err) {
      console.error(err)
      setError('Connection interrupted. Please speak again.')
      setIsAiSpeaking(false)
      setAiSubtitle('')
      // restart listening if error
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } finally {
      setIsGeneratingReply(false)
    }
  }, [report?.jobDescription, report?.resume, speakText])

  // Manual submit — user clicks "Done Answering" button
  const handleManualSubmit = useCallback(() => {
    clearSilenceTimer()
    const text = lastSpeechTextRef.current.trim()
    if (!text) return
    if (recognitionRef.current) recognitionRef.current.stop()
    handleUserAnswerSubmitted(text)
  }, [clearSilenceTimer, handleUserAnswerSubmitted])

  // End Call / Hang Up
  const handleHangUp = () => {
    setStatus('ended')
    window.speechSynthesis?.cancel()
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsAiSpeaking(false)
    setIsGeneratingReply(false)
    setIsListening(false)
    setAiSubtitle('')
  }

  // Evaluate Call Performance
  const handleEvaluateCall = async () => {
    if (history.length < 2) {
      setError('The call was too short to generate a meaningful evaluation.')
      return
    }
    setError('')
    setEvaluating(true)

    // Construct full dialogue transcript
    const transcriptText = history
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
      .join('\n')

    try {
      const data = await evaluateInterviewAnswer({
        question: `Conversational review of the voice mock interview for ${report?.title || 'Job position'}.`,
        userAnswer: transcriptText,
        intention: 'Evaluate candidate live communication, conversational structure, and answers.',
        modelAnswer: 'A high-level developer interview covering experience, state management, and work behavior.'
      })
      setEvaluation(data.evaluation)
    } catch (err) {
      console.error(err)
      setError('Failed to analyze call performance. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="live-call-section">
      <div className="content-header">
        <h2>Live AI Voice Call</h2>
        <span className="content-header__count">Interactive Dialogue</span>
      </div>

      {!isSpeechSupported && (
        <div className="q-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="q-card__body">
            <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>⚠️ Browser Not Supported</h3>
            <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
              Your current browser does not support the Web Speech API required for voice interviews. 
              Please switch to <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on a desktop to use this feature.
            </p>
          </div>
        </div>
      )}

      {isSpeechSupported && status === 'idle' && (
        <div className="call-lobby">
          <div className="lobby-icon">📞</div>
          <h3>Simulate a Real Phone Interview</h3>
          <p>
            Connect with a virtual AI hiring manager who will speak to you and ask questions dynamically. Speak your answers naturally.
          </p>
          <button onClick={handleStartCall} className="button primary-button dial-btn">
            📞 Start Voice Interview
          </button>
        </div>
      )}

      {status === 'calling' && (
        <div className="call-screen calling">
          <div className="pulse-avatar">
            <span className="avatar-letter">AI</span>
          </div>
          <h3 className="caller-name">AI Interviewer</h3>
          <p className="call-status">Dialing &amp; Ringing...</p>
          <button onClick={handleHangUp} className="hangup-btn">
            ❌ Cancel
          </button>
        </div>
      )}

      {status === 'connected' && (
        <div className="call-screen connected">
          <div className="timer-display">{formatTime(timer)}</div>
          
          <div className={`avatar-container ${isListening ? 'listening' : ''} ${isAiSpeaking ? 'speaking' : ''}`}>
            <div className="pulse-avatar">
              <span className="avatar-letter">AI</span>
            </div>
            
            {/* Visual Waveform */}
            <div className="voice-waves">
              <span className="wave bar-1"></span>
              <span className="wave bar-2"></span>
              <span className="wave bar-3"></span>
              <span className="wave bar-4"></span>
              <span className="wave bar-5"></span>
            </div>
          </div>

          <h3 className="caller-name">AI Interviewer</h3>
          
          <p className="call-status">
            {isAiSpeaking && '🔊 AI is speaking...'}
            {isListening && '🎙️ Listening to you... Speak now'}
            {isGeneratingReply && '⌛ Thinking of the next question...'}
            {!isListening && !isAiSpeaking && !isGeneratingReply && '⌛ Processing...'}
          </p>

          {isAiSpeaking && aiSubtitle && (
            <div className="call-subtitle-box" aria-live="polite">
              <span className="call-subtitle-label">AI Subtitle</span>
              <p className="call-subtitle">
                "{aiSubtitle}"
              </p>
            </div>
          )}

          <div className="interim-text-box">
            {currentSpeechText && (
              <p className="interim-text">"{currentSpeechText}"</p>
            )}
            {isListening && !isAiSpeaking && !isGeneratingReply && (
              <p className="silence-hint">⏱ Auto-submits after 4s of silence, or click below</p>
            )}
          </div>

          {error && <p className="call-error">{error}</p>}

          {/* Manual submit button — lets user control when their answer is sent */}
          {isListening && !isAiSpeaking && !isGeneratingReply && currentSpeechText && (
            <button onClick={handleManualSubmit} className="button primary-button done-btn">
              ✅ Done Answering
            </button>
          )}

          <button onClick={handleHangUp} className="hangup-btn">
            🛑 Hang Up
          </button>
        </div>
      )}

      {status === 'ended' && (
        <div className="call-ended-dashboard">
          <div className="success-badge">🏁 Call Completed</div>
          <h3>Interview Summary</h3>
          <p className="ended-hint">
            The live call has ended. You can view the transcript below or click the evaluation button to analyze your speaking score and critique.
          </p>

          <div className="ended-actions">
            <button
              onClick={handleEvaluateCall}
              className="button primary-button eval-call-btn"
              disabled={evaluating}
            >
              {evaluating ? 'Analyzing Speech Performance...' : '📊 Evaluate Call Performance'}
            </button>
            <button onClick={handleStartCall} className="button secondary-button retry-btn">
              🔄 Call Again
            </button>
          </div>

          {error && <p className="simulator-error">{error}</p>}

          {/* Evaluation Results */}
          {evaluation && (
            <div className="call-evaluation-card">
              <h4>Speech Performance Report</h4>
              
              <div className="evaluation-score-wrap">
                <div className={`evaluation-score-pct score--${evaluation.score >= 80 ? 'high' : evaluation.score >= 60 ? 'mid' : 'low'}`}>
                  {evaluation.score}%
                </div>
                <div>
                  <p className="eval-grade">
                    {evaluation.score >= 80 ? '🟢 Strong conversation pacing and response depth.' :
                     evaluation.score >= 60 ? '🟡 Good speech structure, but could eliminate filler phrases.' :
                     '🔴 Short answers or high filler word usage detected.'}
                  </p>
                </div>
              </div>

              {evaluation.fillerWords && evaluation.fillerWords.length > 0 && (
                <div className="eval-section">
                  <strong>Detected Filler Expressions:</strong>
                  <div className="filler-list">
                    {evaluation.fillerWords.map((word, i) => (
                      <span key={i} className="filler-tag">"{word}"</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="eval-section">
                <strong>Constructive Critique:</strong>
                <p>{evaluation.feedback}</p>
              </div>

              <div className="eval-section">
                <strong>Speech Polish Suggestion:</strong>
                <p className="polished-box">"{evaluation.betterAnswer}"</p>
              </div>
            </div>
          )}

          {/* Transcript Log */}
          <div className="call-transcript-log">
            <h4>Call Transcript</h4>
            <div className="transcript-messages">
              {history.map((msg, index) => (
                <div key={index} className={`transcript-bubble bubble--${msg.role}`}>
                  <span className="bubble-role">{msg.role === 'user' ? 'You' : 'Interviewer'}</span>
                  <p className="bubble-text">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveVoiceCall
