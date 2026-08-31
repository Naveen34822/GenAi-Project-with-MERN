import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useSpeechRecognition } from '../useSpeechRecognition'

describe('useSpeechRecognition hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    
    expect(result.current.isListening).toBe(false)
    expect(result.current.currentSpeechText).toBe('')
    expect(typeof result.current.startRecognition).toBe('function')
    expect(typeof result.current.stopRecognition).toBe('function')
  })

  it('should call start on the SpeechRecognition instance', () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    
    act(() => {
      result.current.startRecognition()
    })

    expect(result.current.isListening).toBe(true)
    // The mocked instance's start method should have been called
    expect(result.current.recognitionRef.current.start).toHaveBeenCalled()
  })

  it('should call stop on the SpeechRecognition instance', () => {
    const { result } = renderHook(() => useSpeechRecognition({}))
    
    act(() => {
      result.current.startRecognition()
      result.current.stopRecognition()
    })

    expect(result.current.isListening).toBe(false)
    expect(result.current.recognitionRef.current.stop).toHaveBeenCalled()
  })
})
