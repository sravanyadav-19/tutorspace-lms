import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACTIVITY_EVENTS,
  ACTIVITY_THROTTLE_MS,
  SESSION_ACTIVITY_KEY,
  SESSION_CHECK_INTERVAL_MS,
  SESSION_IDLE_MS,
  SESSION_WARNING_MS
} from '../utils/session'

/**
 * Tracks user activity and exposes idle / warning state.
 * Multi-tab safe via localStorage last-activity timestamp.
 *
 * Important: simply focusing / un-hiding the tab does NOT count as
 * activity. Otherwise a user who left for 25 minutes could return and
 * accidentally reset the idle clock before logout runs.
 */
export function useSessionTimeout({ enabled, onTimeout }) {
  const [warningOpen, setWarningOpen] = useState(false)
  const [remainingMs, setRemainingMs] = useState(SESSION_WARNING_MS)

  const lastActivityRef = useRef(Date.now())
  const lastWriteRef = useRef(0)
  const timedOutRef = useRef(false)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const readStoredActivity = () => {
    try {
      const raw = localStorage.getItem(SESSION_ACTIVITY_KEY)
      const n = raw ? Number(raw) : NaN
      return Number.isFinite(n) ? n : Date.now()
    } catch {
      return Date.now()
    }
  }

  const writeActivity = useCallback((ts = Date.now()) => {
    lastActivityRef.current = ts
    try {
      localStorage.setItem(SESSION_ACTIVITY_KEY, String(ts))
    } catch {
      /* private mode / quota — in-memory still works */
    }
  }, [])

  /** Real user interaction (click, key, scroll, …) — resets idle clock */
  const bumpActivity = useCallback(() => {
    if (!enabled || timedOutRef.current) return
    const now = Date.now()
    lastActivityRef.current = now
    if (now - lastWriteRef.current >= ACTIVITY_THROTTLE_MS) {
      lastWriteRef.current = now
      writeActivity(now)
    }
    // Real activity while warning is open dismisses it
    setWarningOpen((open) => (open ? false : open))
  }, [enabled, writeActivity])

  /**
   * Evaluate idle state. Used by the interval AND when the tab becomes
   * visible again (browsers throttle timers in background tabs).
   * Does NOT treat "tab focused" as activity.
   */
  const evaluateIdle = useCallback(() => {
    if (!enabled || timedOutRef.current) return

    const stored = readStoredActivity()
    const last = Math.max(lastActivityRef.current, stored)
    lastActivityRef.current = last

    const idleFor = Date.now() - last
    const untilLogout = SESSION_IDLE_MS - idleFor

    if (untilLogout <= 0) {
      timedOutRef.current = true
      setWarningOpen(false)
      onTimeoutRef.current?.()
      return
    }

    if (untilLogout <= SESSION_WARNING_MS) {
      setWarningOpen(true)
      setRemainingMs(untilLogout)
    } else {
      setWarningOpen((open) => (open ? false : open))
      setRemainingMs(SESSION_WARNING_MS)
    }
  }, [enabled])

  const staySignedIn = useCallback(() => {
    timedOutRef.current = false
    writeActivity(Date.now())
    lastWriteRef.current = Date.now()
    setWarningOpen(false)
    setRemainingMs(SESSION_WARNING_MS)
  }, [writeActivity])

  // Reset tracking when session becomes active (login)
  useEffect(() => {
    if (!enabled) {
      setWarningOpen(false)
      timedOutRef.current = false
      return
    }
    timedOutRef.current = false
    const ts = Date.now()
    lastActivityRef.current = ts
    lastWriteRef.current = ts
    writeActivity(ts)
    setWarningOpen(false)
    setRemainingMs(SESSION_WARNING_MS)
  }, [enabled, writeActivity])

  // Real interaction listeners only (NOT focus / visibility alone)
  useEffect(() => {
    if (!enabled) return undefined

    const handler = () => bumpActivity()
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handler, { passive: true, capture: true })
    })

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handler, { capture: true })
      })
    }
  }, [enabled, bumpActivity])

  // When user returns to the tab, CHECK idle — do not reset the clock
  useEffect(() => {
    if (!enabled) return undefined

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        evaluateIdle()
      }
    }
    const onFocus = () => evaluateIdle()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, evaluateIdle])

  // Cross-tab activity sync (another TutorSpace tab still being used)
  useEffect(() => {
    if (!enabled) return undefined
    const onStorage = (e) => {
      if (e.key !== SESSION_ACTIVITY_KEY || e.newValue == null) return
      const ts = Number(e.newValue)
      if (!Number.isFinite(ts)) return
      lastActivityRef.current = Math.max(lastActivityRef.current, ts)
      // Re-evaluate; may clear warning if other tab is active
      evaluateIdle()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [enabled, evaluateIdle])

  // Idle checker interval (may be throttled while tab is in background)
  useEffect(() => {
    if (!enabled) return undefined

    evaluateIdle()
    const id = window.setInterval(evaluateIdle, SESSION_CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, evaluateIdle])

  return {
    warningOpen,
    remainingMs,
    staySignedIn,
    idleLimitMs: SESSION_IDLE_MS,
    warningLimitMs: SESSION_WARNING_MS
  }
}
