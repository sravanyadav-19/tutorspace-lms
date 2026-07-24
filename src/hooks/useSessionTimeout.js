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

  const bumpActivity = useCallback(() => {
    if (!enabled || timedOutRef.current) return
    const now = Date.now()
    // Always update in-memory; throttle storage for mousemove storms
    lastActivityRef.current = now
    if (now - lastWriteRef.current >= ACTIVITY_THROTTLE_MS) {
      lastWriteRef.current = now
      writeActivity(now)
    }
    // Any real activity while warning is open dismisses it
    setWarningOpen((open) => (open ? false : open))
  }, [enabled, writeActivity])

  const staySignedIn = useCallback(() => {
    timedOutRef.current = false
    writeActivity(Date.now())
    lastWriteRef.current = Date.now()
    setWarningOpen(false)
    setRemainingMs(SESSION_WARNING_MS)
  }, [writeActivity])

  // Reset tracking when session becomes active
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

  // Activity listeners
  useEffect(() => {
    if (!enabled) return undefined

    const handler = () => bumpActivity()
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handler, { passive: true, capture: true })
    })
    // Tab focus / visibility also counts as activity
    const onVisible = () => {
      if (document.visibilityState === 'visible') bumpActivity()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', handler)

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handler, { capture: true })
      })
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', handler)
    }
  }, [enabled, bumpActivity])

  // Cross-tab activity sync
  useEffect(() => {
    if (!enabled) return undefined
    const onStorage = (e) => {
      if (e.key !== SESSION_ACTIVITY_KEY || e.newValue == null) return
      const ts = Number(e.newValue)
      if (!Number.isFinite(ts)) return
      lastActivityRef.current = ts
      if (warningOpen) setWarningOpen(false)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [enabled, warningOpen])

  // Idle checker (single interval for the life of an authenticated session)
  useEffect(() => {
    if (!enabled) return undefined

    const tick = () => {
      if (timedOutRef.current) return

      // Prefer latest across memory + storage (other tabs)
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
    }

    tick()
    const id = window.setInterval(tick, SESSION_CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled])

  return {
    warningOpen,
    remainingMs,
    staySignedIn,
    idleLimitMs: SESSION_IDLE_MS,
    warningLimitMs: SESSION_WARNING_MS
  }
}
