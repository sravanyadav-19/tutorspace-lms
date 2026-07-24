/**
 * Session timeout configuration
 * Applies to every authenticated role (admin / teacher / student).
 *
 * Override via Vite env if needed:
 *   VITE_SESSION_IDLE_MS=900000
 *   VITE_SESSION_WARNING_MS=60000
 */

const readMs = (key, fallback) => {
  const raw = import.meta.env?.[key]
  const n = raw != null ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** How long the user may be idle before forced logout (default 15 min) */
export const SESSION_IDLE_MS = readMs('VITE_SESSION_IDLE_MS', 15 * 60 * 1000)

/** Warning modal countdown before logout (default 60s, capped under idle) */
export const SESSION_WARNING_MS = Math.min(
  readMs('VITE_SESSION_WARNING_MS', 60 * 1000),
  Math.max(5_000, SESSION_IDLE_MS - 5_000)
)

/** How often we re-check idle state */
export const SESSION_CHECK_INTERVAL_MS = 1_000

/** localStorage key shared across tabs */
export const SESSION_ACTIVITY_KEY = 'tutorspace_last_activity'

/** Session end reason keys (query / sessionStorage) */
export const SESSION_END_REASON = {
  IDLE: 'idle_timeout',
  EXPIRED: 'token_expired',
  LOGOUT: 'logout'
}

export const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel'
]

/** Throttle activity writes so mousemove does not thrash storage */
export const ACTIVITY_THROTTLE_MS = 1_000

export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}
