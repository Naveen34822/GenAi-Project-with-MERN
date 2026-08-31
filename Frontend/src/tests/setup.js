import '@testing-library/jest-dom'
import { vi } from 'vitest'

class MockSpeechRecognition {
  constructor() {
    this.start = vi.fn(() => {
      if (this.onstart) this.onstart()
    })
    this.stop = vi.fn(() => {
      if (this.onend) this.onend()
    })
    this.abort = vi.fn()
    this.onresult = null
    this.onerror = null
    this.onend = null
  }
}
window.SpeechRecognition = MockSpeechRecognition
window.webkitSpeechRecognition = MockSpeechRecognition

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve('stream')),
  },
})

// Mock SpeechSynthesis API
window.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  onvoiceschanged: null,
  getVoices: vi.fn(() => []),
}

window.SpeechSynthesisUtterance = vi.fn(() => ({}))

// Mock MatchMedia (needed for some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
