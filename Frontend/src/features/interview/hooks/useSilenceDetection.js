import { useRef, useCallback } from 'react'

/**
 * Reusable hook for silence-based auto-submit detection.
 * Fires a callback after a configurable delay of no new speech input.
 *
 * @param {Object} options
 * @param {Function} options.onSilenceTimeout - Called when silence threshold is exceeded
 * @param {number}   options.delay - Milliseconds of silence before triggering (default: 4000)
 * @returns {{ startSilenceTimer, clearSilenceTimer, lastSpeechTextRef }}
 */
export const useSilenceDetection = ({ onSilenceTimeout, delay = 4000 } = {}) => {
  const silenceTimerRef = useRef(null)
  const lastSpeechTextRef = useRef('')
  const onSilenceTimeoutRef = useRef(onSilenceTimeout)

  // Keep callback ref fresh
  onSilenceTimeoutRef.current = onSilenceTimeout

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback((text) => {
    clearSilenceTimer()
    lastSpeechTextRef.current = text
    if (!text.trim()) return
    silenceTimerRef.current = setTimeout(() => {
      if (lastSpeechTextRef.current.trim()) {
        onSilenceTimeoutRef.current?.(lastSpeechTextRef.current.trim())
      }
    }, delay)
  }, [clearSilenceTimer, delay])

  return { startSilenceTimer, clearSilenceTimer, lastSpeechTextRef }
}
