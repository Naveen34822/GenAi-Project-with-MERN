import { useState, useCallback } from 'react'

/**
 * Reusable hook for managing the Web SpeechSynthesis API (text-to-speech).
 * Handles speaking, cancellation, and onEnd callback for mic restart.
 *
 * @param {Object} options
 * @param {Function} options.onSpeechEnd - Called when the AI finishes speaking (e.g., to restart user's mic)
 * @returns {{ isAiSpeaking, aiSubtitle, speakText, cancelSpeech }}
 */
export const useSpeechSynthesis = ({ onSpeechEnd } = {}) => {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [aiSubtitle, setAiSubtitle] = useState('')

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()
    setIsAiSpeaking(true)
    setAiSubtitle(text)

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onend = () => {
      setIsAiSpeaking(false)
      onSpeechEnd?.()
    }

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e)
      setIsAiSpeaking(false)
      setAiSubtitle('')
      onSpeechEnd?.()
    }

    window.speechSynthesis.speak(utterance)
  }, [onSpeechEnd])

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsAiSpeaking(false)
    setAiSubtitle('')
  }, [])

  return { isAiSpeaking, aiSubtitle, setAiSubtitle, speakText, cancelSpeech }
}
