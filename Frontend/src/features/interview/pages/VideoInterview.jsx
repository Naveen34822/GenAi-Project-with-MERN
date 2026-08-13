import React, { useCallback, useEffect, useRef, useState } from 'react'
import '../style/videoInterview.scss'
import { useInterview } from '../hooks/useInterview'
import { evaluateInterviewAnswer, generateLiveVoiceChatReply } from '../services/interview.api'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const isSpeechSupported = !!SpeechRecognition
const isCameraSupported = !!navigator.mediaDevices?.getUserMedia

const VideoInterview = () => {
  const { report } = useInterview()

  const [status, setStatus] = useState('idle')
  const [timer, setTimer] = useState(0)
  const [history, setHistory] = useState([])
  const [currentSpeechText, setCurrentSpeechText] = useState('')
  const [aiSubtitle, setAiSubtitle] = useState('')
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const recognitionRef = useRef(null)
  const historyRef = useRef([])
  const statusRef = useRef(status)
  const mutedRef = useRef(isMuted)

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    mutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    let interval = null
    if (status === 'connected') {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    } else {
      setTimer(0)
    }

    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (status === 'connected' && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current
    }
  }, [status])

  useEffect(() => {
    if (isSpeechSupported) {
      const rec = new SpeechRecognition()
      rec.continuous = false
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
      }

      rec.onerror = (event) => {
        console.error('Video interview speech recognition error:', event.error)
        setIsListening(false)
        if (event.error !== 'no-speech') {
          setError('Microphone recognition stopped. Please check your browser permissions.')
        }
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
      stopCamera()
    }
  }, [])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
  }

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startCamera = async () => {
    if (!isCameraSupported) {
      throw new Error('Camera tools are not supported in this browser.')
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    })

    mediaStreamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }

  const startListening = useCallback(() => {
    if (mutedRef.current || statusRef.current !== 'connected' || !recognitionRef.current) return

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.log('Video interview recognition already running or failed to start:', err)
    }
  }, [])

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()
    setIsAiSpeaking(true)
    setAiSubtitle(text)

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onend = () => {
      setIsAiSpeaking(false)
      startListening()
    }

    utterance.onerror = (event) => {
      console.error('Video interview speech synthesis error:', event)
      setIsAiSpeaking(false)
      setAiSubtitle('')
      startListening()
    }

    window.speechSynthesis.speak(utterance)
  }, [startListening])

  const handleUserAnswerSubmitted = useCallback(async (text) => {
    const userMsg = { role: 'user', text }
    const updatedHistory = [...historyRef.current, userMsg]
    setHistory(updatedHistory)
    setCurrentSpeechText('')
    setAiSubtitle('')
    setError('')

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
      setError('The AI interviewer could not respond. Please try again.')
      startListening()
    } finally {
      setIsGeneratingReply(false)
    }
  }, [report?.jobDescription, report?.resume, speakText, startListening])

  useEffect(() => {
    if (!isListening && currentSpeechText.trim() && status === 'connected' && !isAiSpeaking && !isGeneratingReply) {
      handleUserAnswerSubmitted(currentSpeechText.trim())
    }
  }, [currentSpeechText, handleUserAnswerSubmitted, isAiSpeaking, isGeneratingReply, isListening, status])

  const handleStartInterview = async () => {
    if (!isSpeechSupported) {
      setError('Speech tools are not supported in this browser. Please use Google Chrome.')
      return
    }

    setError('')
    setEvaluation(null)
    setHistory([])
    setCurrentSpeechText('')
    setAiSubtitle('')
    setIsMuted(false)
    setIsCameraOff(false)
    setStatus('connecting')

    try {
      await startCamera()
      setStatus('connected')

      const initialGreeting = `Hello, welcome to your AI video interview for the ${report?.title || 'role'}. I will ask follow-up questions like a real interviewer. Please look at the camera and start by introducing yourself.`
      const greetingMsg = { role: 'model', text: initialGreeting }

      setHistory([greetingMsg])
      speakText(initialGreeting)
    } catch (err) {
      console.error(err)
      setStatus('idle')
      setError('Camera permission is required to start the video interview.')
      stopCamera()
    }
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (nextMuted) {
      recognitionRef.current?.abort()
      setIsListening(false)
    } else if (status === 'connected' && !isAiSpeaking && !isGeneratingReply) {
      startListening()
    }
  }

  const handleToggleCamera = () => {
    const nextCameraOff = !isCameraOff
    setIsCameraOff(nextCameraOff)
    mediaStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = !nextCameraOff
    })
  }

  const handleEndInterview = () => {
    setStatus('ended')
    window.speechSynthesis?.cancel()
    recognitionRef.current?.abort()
    stopCamera()
    setIsAiSpeaking(false)
    setIsListening(false)
    setIsGeneratingReply(false)
    setAiSubtitle('')
    setCurrentSpeechText('')
  }

  const handleEvaluateInterview = async () => {
    if (history.length < 2) {
      setError('The video interview was too short to evaluate.')
      return
    }

    setError('')
    setEvaluating(true)

    const transcriptText = history
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
      .join('\n')

    try {
      const data = await evaluateInterviewAnswer({
        question: `Video interview review for ${report?.title || 'Job position'}.`,
        userAnswer: transcriptText,
        intention: 'Evaluate camera interview communication, structure, clarity, confidence, and role fit.',
        modelAnswer: 'A strong candidate gives direct answers, uses examples, maintains professional pacing, and asks thoughtful follow-up questions.'
      })

      setEvaluation(data.evaluation)
    } catch (err) {
      console.error(err)
      setError('Failed to generate the video interview report. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  const connectionStatus = () => {
    if (isAiSpeaking) return 'AI interviewer is speaking'
    if (isListening) return 'Listening to your answer'
    if (isGeneratingReply) return 'Preparing the next question'
    return 'Ready'
  }

  return (
    <div className="video-interview-section">
      <div className="content-header">
        <h2>Real-Time AI Video Interview</h2>
        <span className="content-header__count">Camera + Voice</span>
      </div>

      {status === 'idle' && (
        <div className="video-lobby">
          <div className="video-lobby__preview">
            <div className="video-lobby__avatar">AI</div>
            <div className="video-lobby__scanline" />
          </div>
          <div className="video-lobby__copy">
            <h3>Practice in a video-call interview room</h3>
            <p>
              Start a camera interview with an AI hiring manager, live voice questions, subtitles, transcript, and a final communication report.
            </p>
            {error && <p className="video-error">{error}</p>}
            <button onClick={handleStartInterview} className="button primary-button video-start-btn">
              Start Video Interview
            </button>
          </div>
        </div>
      )}

      {status === 'connecting' && (
        <div className="video-connecting">
          <div className="video-loader" />
          <h3>Joining interview room</h3>
          <p>Allow camera permission when your browser asks.</p>
          <button onClick={handleEndInterview} className="video-control danger">
            Cancel
          </button>
        </div>
      )}

      {status === 'connected' && (
        <div className="video-room">
          <div className="video-room__topbar">
            <div>
              <span className="video-room__eyebrow">Live interview</span>
              <strong>{report?.title || 'AI Interview'}</strong>
            </div>
            <span className="video-room__timer">{formatTime(timer)}</span>
          </div>

          <div className="video-grid">
            <div className={`ai-video-tile ${isAiSpeaking ? 'speaking' : ''} ${isGeneratingReply ? 'thinking' : ''}`}>
              <div className="ai-face">
                <span>AI</span>
                <div className="ai-face__ring" />
              </div>
              <div className="ai-wave">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="tile-footer">
                <span>AI Interviewer</span>
                <strong>{connectionStatus()}</strong>
              </div>
            </div>

            <div className={`candidate-video-tile ${isCameraOff ? 'camera-off' : ''}`}>
              <video ref={videoRef} autoPlay muted playsInline className="candidate-video" />
              {isCameraOff && (
                <div className="camera-off-overlay">
                  <span>You</span>
                  <p>Camera is off</p>
                </div>
              )}
              <div className="tile-footer">
                <span>You</span>
                <strong>{isMuted ? 'Muted' : isListening ? 'Answering' : 'Camera ready'}</strong>
              </div>
            </div>
          </div>

          <div className="live-caption-panel">
            <div className="caption-block">
              <span>AI Subtitle</span>
              <p>{aiSubtitle || 'The interviewer subtitles will appear here while AI is speaking.'}</p>
            </div>
            <div className="caption-block candidate-caption">
              <span>Your Live Transcript</span>
              <p>{currentSpeechText || 'Your spoken answer appears here as the microphone listens.'}</p>
            </div>
          </div>

          {error && <p className="video-error">{error}</p>}

          <div className="video-controls">
            <button onClick={handleToggleMute} className={`video-control ${isMuted ? 'active' : ''}`}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button onClick={handleToggleCamera} className={`video-control ${isCameraOff ? 'active' : ''}`}>
              {isCameraOff ? 'Camera On' : 'Camera Off'}
            </button>
            <button onClick={handleEndInterview} className="video-control danger">
              End Interview
            </button>
          </div>
        </div>
      )}

      {status === 'ended' && (
        <div className="video-summary">
          <div className="video-summary__badge">Interview completed</div>
          <h3>Video Interview Report</h3>
          <p>
            Review the transcript and generate a final score for communication, structure, confidence, and answer quality.
          </p>

          <div className="video-summary__actions">
            <button onClick={handleEvaluateInterview} className="button primary-button" disabled={evaluating}>
              {evaluating ? 'Analyzing Interview...' : 'Evaluate Video Interview'}
            </button>
            <button onClick={handleStartInterview} className="button secondary-button">
              Restart Interview
            </button>
          </div>

          {error && <p className="video-error">{error}</p>}

          {evaluation && (
            <div className="video-evaluation-card">
              <div className="video-evaluation-card__score">
                <span>{evaluation.score}%</span>
                <p>{evaluation.score >= 80 ? 'Strong video interview performance' : evaluation.score >= 60 ? 'Good foundation with clear improvement areas' : 'Needs more structured practice'}</p>
              </div>

              {evaluation.fillerWords?.length > 0 && (
                <div className="video-eval-section">
                  <strong>Filler words</strong>
                  <div className="video-filler-list">
                    {evaluation.fillerWords.map((word, index) => (
                      <span key={index}>{word}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="video-eval-section">
                <strong>Feedback</strong>
                <p>{evaluation.feedback}</p>
              </div>

              <div className="video-eval-section">
                <strong>Improved response style</strong>
                <p>{evaluation.betterAnswer}</p>
              </div>
            </div>
          )}

          <div className="video-transcript">
            <h4>Interview Transcript</h4>
            <div className="video-transcript__list">
              {history.map((msg, index) => (
                <div key={index} className={`video-transcript__bubble ${msg.role === 'user' ? 'user' : 'model'}`}>
                  <span>{msg.role === 'user' ? 'You' : 'AI Interviewer'}</span>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoInterview
