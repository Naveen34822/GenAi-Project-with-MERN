import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSilenceDetection } from '../useSilenceDetection'

describe('useSilenceDetection hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call onSilenceTimeout after the specified delay', () => {
    const onSilenceTimeout = vi.fn()
    const { result } = renderHook(() => 
      useSilenceDetection({ delay: 1000, onSilenceTimeout })
    )

    act(() => {
      // User says something
      result.current.startSilenceTimer('hello world')
    })

    // Callback should not be called immediately
    expect(onSilenceTimeout).not.toHaveBeenCalled()

    act(() => {
      // Advance time by 500ms (not enough to trigger)
      vi.advanceTimersByTime(500)
    })
    expect(onSilenceTimeout).not.toHaveBeenCalled()

    act(() => {
      // Advance by another 500ms (reaches 1000ms delay)
      vi.advanceTimersByTime(500)
    })
    expect(onSilenceTimeout).toHaveBeenCalledTimes(1)
    expect(onSilenceTimeout).toHaveBeenCalledWith('hello world')
  })

  it('should reset the timer if speech is detected again before timeout', () => {
    const onSilenceTimeout = vi.fn()
    const { result } = renderHook(() => 
      useSilenceDetection({ delay: 1000, onSilenceTimeout })
    )

    act(() => {
      result.current.startSilenceTimer('hello')
    })

    act(() => {
      vi.advanceTimersByTime(800)
      // Speak again before 1000ms is up
      result.current.startSilenceTimer('hello world')
    })

    act(() => {
      // Advance 500ms more (total 1300ms from start)
      vi.advanceTimersByTime(500)
    })
    
    // Should NOT have been called because the timer was reset at 800ms
    expect(onSilenceTimeout).not.toHaveBeenCalled()

    act(() => {
      // Advance 500ms more (reaches 1000ms from the SECOND speech)
      vi.advanceTimersByTime(500)
    })

    expect(onSilenceTimeout).toHaveBeenCalledTimes(1)
    expect(onSilenceTimeout).toHaveBeenCalledWith('hello world')
  })
})
