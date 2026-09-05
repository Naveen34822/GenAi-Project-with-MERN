import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import '../style/upgradeModal.scss'

/**
 * 3D Upgrade Modal — shown when a free user hits their 30-day trial limit.
 *
 * Props:
 *  - isOpen    {boolean} : whether to show the modal
 *  - onClose   {fn}      : called when user dismisses the modal
 *  - used      {number}  : how many reports used (e.g. 3)
 *  - limit     {number}  : the free limit (e.g. 3)
 *  - resetsAt  {string}  : ISO date string of when the 30-day window resets
 */
const UpgradeModal = ({ isOpen, onClose, used = 3, limit = 3, resetsAt }) => {
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const overlayRef = useRef(null)

  // Format resetsAt into a human-readable string like "Oct 5, 2026 at 2:31 PM"
  const resetDateLabel = resetsAt
    ? new Date(resetsAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '30 days from your first report'

  // 3D Tilt on Mouse Move
  useEffect(() => {
    if (!isOpen) return
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -12
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 12
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isOpen])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={`upgrade-overlay upgrade-overlay--visible`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="upgrade-modal" ref={cardRef}>

        <button className="upgrade-modal__close" onClick={onClose} aria-label="Close">
          x
        </button>

        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="orb orb--3" />

        <div className="modal-icon-wrap">
          <div className="modal-icon-ring modal-icon-ring--outer" />
          <div className="modal-icon-ring modal-icon-ring--inner" />
          <div className="modal-icon">LOCK</div>
        </div>

        <h2 className="modal-title">Free Trial Ended</h2>

        <p className="modal-subtitle">
          You have used all <strong>{limit}</strong> reports in your current
          <span className="modal-subtitle__pro"> 30-day free trial</span> period.
          Upgrade to <span className="modal-subtitle__pro">Pro</span> for unlimited access!
        </p>

        <div className="usage-meter">
          <div className="usage-meter__label">
            <span>Trial Reports</span>
            <span className="usage-meter__count">{used}/{limit} Used</span>
          </div>
          <div className="usage-meter__bar">
            <div
              className="usage-meter__fill"
              style={{ width: `${(used / limit) * 100}%` }}
            />
          </div>
          <p className="usage-meter__note">
            Resets on: <strong>{resetDateLabel}</strong>
          </p>
        </div>

        <div className="modal-features">
          <div className="modal-features__col modal-features__col--free">
            <div className="col-header col-header--free">Free</div>
            <ul>
              <li className="feat feat--done">3 Reports / month</li>
              <li className="feat feat--done">ATS Score (1/week)</li>
              <li className="feat feat--lock">Live Voice Interview</li>
              <li className="feat feat--lock">Video Interview</li>
              <li className="feat feat--lock">Unlimited Reports</li>
            </ul>
          </div>
          <div className="modal-features__col modal-features__col--pro">
            <div className="col-header col-header--pro">Pro</div>
            <ul>
              <li className="feat feat--done">Unlimited Reports</li>
              <li className="feat feat--done">Unlimited ATS Scans</li>
              <li className="feat feat--done">Live Voice Interview</li>
              <li className="feat feat--done">Video Interview</li>
              <li className="feat feat--done">Priority AI Responses</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="modal-btn modal-btn--upgrade"
            onClick={() => { onClose(); navigate('/pricing') }}
            id="modal-upgrade-btn"
          >
            <span className="btn-shine" />
            Upgrade to Pro - Rs.299/month
          </button>
          <button className="modal-btn modal-btn--dismiss" onClick={onClose}>
            Maybe later
          </button>
        </div>

        <p className="modal-trust">
          Secure payment via Razorpay. Cancel anytime.
        </p>

      </div>
    </div>
  )
}

export default UpgradeModal
