import { useState, useRef, useEffect, useCallback } from 'react'

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
export const isSpeechSupported = !!SpeechRecognitionAPI

/**
 * Reusable hook for managing the Web Speech Recognition API lifecycle.
 * Handles initialization, auto-restart, interim results, and cleanup.
 *
 * @param {Object} options
 * @param {Function} options.onSpeechResult - Called with the latest transcript text on every result
 * @param {string}   options.lang - Language for recognition (default: 'en-US')
 * @returns {{ isListening, currentSpeechText, startRecognition, stopRecognition, recognitionRef }}
 */
export const useSpeechRecognition = ({ onSpeechResult, lang = 'en-US' } = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [currentSpeechText, setCurrentSpeechText] = useState('')
  const recognitionRef = useRef(null)
  const statusRef = useRef('idle') // 'idle' | 'connected' — managed externally via startRecognition/stopRecognition
  const onSpeechResultRef = useRef(onSpeechResult)

  // Keep the callback ref fresh
  useEffect(() => {
    onSpeechResultRef.current = onSpeechResult
  }, [onSpeechResult])

  useEffect(() => {
    if (!isSpeechSupported) return

    const rec = new SpeechRecognitionAPI()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang

    rec.onstart = () => {
      setIsListening(true)
      setCurrentSpeechText('')
    }

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      setCurrentSpeechText(transcript)
      onSpeechResultRef.current?.(transcript)
    }

    rec.onerror = (event) => {
      if (event.error === 'no-speech') return
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    rec.onend = () => {
      // Auto-restart if still supposed to be listening
      if (statusRef.current === 'connected') {
        try { rec.start() } catch (e) { /* already running */ }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = rec

    return () => {
      statusRef.current = 'idle'
      recognitionRef.current?.abort()
    }
  }, [lang])

  const startRecognition = useCallback(() => {
    statusRef.current = 'connected'
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.log('Recognition already running or failed to start:', e)
    }
  }, [])

  const stopRecognition = useCallback(() => {
    statusRef.current = 'idle'
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch (e) { /* not running */ }
    setIsListening(false)
  }, [])

  return { isListening, currentSpeechText, setCurrentSpeechText, startRecognition, stopRecognition, recognitionRef, statusRef }
}
