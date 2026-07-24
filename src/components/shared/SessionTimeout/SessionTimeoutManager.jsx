import React, { useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useSessionTimeout } from '../../../hooks/useSessionTimeout'
import { SESSION_END_REASON } from '../../../utils/session'
import SessionTimeoutModal from './SessionTimeoutModal'

/**
 * Mount once inside the authenticated app tree.
 * Enforces idle timeout for every role (admin / teacher / student).
 */
const SessionTimeoutManager = () => {
  const { isAuthenticated, logout, loading } = useAuth()
  const enabled = !loading && isAuthenticated()

  const handleTimeout = useCallback(() => {
    logout(SESSION_END_REASON.IDLE)
  }, [logout])

  const {
    warningOpen,
    remainingMs,
    staySignedIn,
    warningLimitMs
  } = useSessionTimeout({
    enabled,
    onTimeout: handleTimeout
  })

  if (!enabled) return null

  return (
    <SessionTimeoutModal
      open={warningOpen}
      remainingMs={remainingMs}
      warningLimitMs={warningLimitMs}
      onStay={staySignedIn}
      onLogout={() => logout(SESSION_END_REASON.LOGOUT)}
    />
  )
}

export default SessionTimeoutManager
