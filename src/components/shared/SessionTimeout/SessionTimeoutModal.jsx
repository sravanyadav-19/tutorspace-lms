import React, { useEffect, useId, useRef } from 'react'
import { Clock } from 'lucide-react'
import Button from '../Button'
import { formatCountdown } from '../../../utils/session'
import styles from './SessionTimeoutModal.module.css'

const SessionTimeoutModal = ({
  open,
  remainingMs,
  warningLimitMs,
  onStay,
  onLogout
}) => {
  const titleId = useId()
  const stayBtnRef = useRef(null)

  useEffect(() => {
    if (open) {
      // Focus primary action for keyboard users
      const t = window.setTimeout(() => stayBtnRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onStay?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onStay])

  if (!open) return null

  const pct = Math.max(
    0,
    Math.min(100, (remainingMs / Math.max(warningLimitMs, 1)) * 100)
  )

  return (
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-desc`}
    >
      <div className={styles.modal}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Clock size={28} />
        </div>
        <h2 id={titleId} className={styles.title}>
          Still there?
        </h2>
        <p id={`${titleId}-desc`} className={styles.message}>
          You&apos;ve been inactive. For security, you will be signed out
          automatically when the timer reaches zero.
        </p>

        <div className={styles.countdown} aria-live="polite" aria-atomic="true">
          {formatCountdown(remainingMs)}
        </div>
        <p className={styles.countdownLabel}>until automatic logout</p>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${pct}%` }} />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onLogout}>
            Log out now
          </Button>
          <Button
            ref={stayBtnRef}
            type="button"
            variant="primary"
            onClick={onStay}
          >
            Stay signed in
          </Button>
        </div>
        <p className={styles.hint}>
          Move the mouse, press a key, or click Stay signed in to continue.
        </p>
      </div>
    </div>
  )
}

export default SessionTimeoutModal
