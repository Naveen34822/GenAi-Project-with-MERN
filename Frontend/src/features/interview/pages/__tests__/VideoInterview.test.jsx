import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VideoInterview from '../VideoInterview'

// Mock the CSS import
vi.mock('../../style/videoInterview.scss', () => ({}))

// Mock the hook
vi.mock('../../hooks/useInterview', () => ({
  useInterview: () => ({
    report: {
      _id: '123',
      title: 'Senior React Developer',
      jobDescription: 'Need React skills',
      resume: 'I have React skills'
    }
  })
}))

// Mock the hook and the supported flag
vi.mock('../../hooks/useSpeechRecognition', () => ({
  isSpeechSupported: true,
  useSpeechRecognition: vi.fn(() => ({
    isListening: false,
    currentSpeechText: '',
    setCurrentSpeechText: vi.fn(),
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    recognitionRef: { current: null }
  }))
}))

describe('VideoInterview Component', () => {
  it('renders the video lobby initially', () => {
    render(<VideoInterview />)
    
    // Check if the title is rendered
    expect(screen.getByText('Real-Time AI Video Interview')).toBeInTheDocument()
    
    // Check if the lobby start button is rendered
    expect(screen.getByText('Start Video Interview')).toBeInTheDocument()
  })
})
