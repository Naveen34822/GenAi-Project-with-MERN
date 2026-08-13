import React, { useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import AtsScore from './AtsScore'
import MockInterview from './MockInterview'
import LiveVoiceCall from './LiveVoiceCall'
import VideoInterview from './VideoInterview'

const NAV_ITEMS = [
  {
    id: 'technical',
    label: 'Technical Questions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  },
  {
    id: 'behavioral',
    label: 'Behavioral Questions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: 'roadmap',
    label: 'Road Map',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    )
  },
  {
    id: 'ats',
    label: 'ATS Score',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  },
  {
    id: 'mock',
    label: 'Mock Interview',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    )
  },
  {
    id: 'voicecall',
    label: 'Live AI Voice Call',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    )
  },
  {
    id: 'videointerview',
    label: 'AI Video Interview',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    )
  },
]

// ── Sub-components ─
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className='q-card'>
      <div className='q-card__header' onClick={() => setOpen(o => !o)}>
        <span className='q-card__index'>Q{index + 1}</span>
        <p className='q-card__question'>{item.question}</p>
        <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {open && (
        <div className='q-card__body'>
          <div className='q-card__section'>
            <span className='q-card__tag q-card__tag--intention'>Intention</span>
            <p>{item.intention}</p>
          </div>
          <div className='q-card__section'>
            <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const RoadMapDay = ({ day }) => (
  <div className='roadmap-day'>
    <div className='roadmap-day__header'>
      <span className='roadmap-day__badge'>Day {day.day}</span>
      <h3 className='roadmap-day__focus'>{day.focus}</h3>
    </div>
    <ul className='roadmap-day__tasks'>
      {day.tasks.map((task, i) => (
        <li key={i}>
          <span className='roadmap-day__bullet' />
          {task}
        </li>
      ))}
    </ul>
  </div>
)

// Main Component ─
const Interview = () => {
  const [activeNav, setActiveNav] = useState('technical')
  const { report, loading } = useInterview()

  if (loading || !report) {
    return (
      <main className='loading-screen'>
        <h1>Loading your interview plan...</h1>
      </main>
    )
  }

  const scoreColor =
    report.matchScore >= 80 ? 'score--high' :
      report.matchScore >= 60 ? 'score--mid' : 'score--low'

  return (
    <div className='interview-page'>
      <div className='interview-layout'>

        {/* ── Left Nav ── */}
        <nav className='interview-nav'>
          <div className="nav-content">
            <p className='interview-nav__label'>Sections</p>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className='interview-nav__icon'>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className='interview-divider' />

        {/* ── Center Content ── */}
        <main className='interview-content'>
          {activeNav === 'technical' && (
            <section>
              <div className='content-header'>
                <h2>Technical Questions</h2>
                <span className='content-header__count'>
                  {report.technicalQuestions.length} questions
                </span>
              </div>
              <div className='q-list'>
                {report.technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'behavioral' && (
            <section>
              <div className='content-header'>
                <h2>Behavioral Questions</h2>
                <span className='content-header__count'>
                  {report.behavioralQuestions.length} questions
                </span>
              </div>
              <div className='q-list'>
                {report.behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'roadmap' && (
            <section>
              <div className='content-header'>
                <h2>Preparation Road Map</h2>
                <span className='content-header__count'>
                  {report.preparationPlan.length}-day plan
                </span>
              </div>
              <div className='roadmap-list'>
                {report.preparationPlan.map((day) => (
                  <RoadMapDay key={day.day} day={day} />
                ))}
              </div>
            </section>
          )}

          {activeNav === 'ats' && (
            <section>
              <AtsScore />
            </section>
          )}
          {activeNav === 'mock' && (
            <section>
              <MockInterview />
            </section>
          )}
          {activeNav === 'voicecall' && (
            <section>
              <LiveVoiceCall />
            </section>
          )}
          {activeNav === 'videointerview' && (
            <section>
              <VideoInterview />
            </section>
          )}
        </main>

        <div className='interview-divider' />

        {/* ── Right Sidebar ── */}
        <aside className='interview-sidebar'>

          {/* Match Score */}
          <div className='match-score'>
            <p className='match-score__label'>Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className='match-score__value'>{report.matchScore}</span>
              <span className='match-score__pct'>%</span>
            </div>
            <p className='match-score__sub'>Strong match for this role</p>
          </div>

          <div className='sidebar-divider' />

          {/* Skill Gaps */}
          <div className='skill-gaps'>
            <p className='skill-gaps__label'>Skill Gaps</p>
            <div className='skill-gaps__list'>
              {report.skillGaps.map((gap, i) => (
                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}

export default Interview
