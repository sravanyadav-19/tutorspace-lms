import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  SESSION_ACTIVITY_KEY,
  SESSION_END_REASON
} from '../utils/session'

const AuthContext = createContext(null)

const clearAuthStorage = () => {
  localStorage.removeItem('tutorspace_token')
  localStorage.removeItem('tutorspace_user')
  localStorage.removeItem(SESSION_ACTIVITY_KEY)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('tutorspace_token')
    const savedUser = localStorage.getItem('tutorspace_user')

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        const base64Url = savedToken.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        if (payload.exp * 1000 > Date.now()) {
          setToken(savedToken)
          setUser(userData)
          // Seed activity so a restored tab doesn't instantly time out
          if (!localStorage.getItem(SESSION_ACTIVITY_KEY)) {
            localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()))
          }
        } else {
          clearAuthStorage()
          // Mark reason so Login can show a friendly banner
          sessionStorage.setItem('tutorspace_session_reason', SESSION_END_REASON.EXPIRED)
        }
      } catch (e) {
        console.error('Corrupted auth data, clearing', e)
        clearAuthStorage()
      }
    }
    setLoading(false)
  }, [])

  // Cross-tab logout sync: if another tab clears the token, follow
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'tutorspace_token' && e.newValue == null && e.oldValue != null) {
        setUser(null)
        setToken(null)
        const path = window.location.pathname || ''
        if (!path.startsWith('/login') && !path.startsWith('/register')) {
          window.location.href = '/login?reason=logout'
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('tutorspace_token', authToken)
    localStorage.setItem('tutorspace_user', JSON.stringify(userData))
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()))
    sessionStorage.removeItem('tutorspace_session_reason')
  }, [])

  /**
   * @param {string} [reason] - idle_timeout | token_expired | logout
   */
  const logout = useCallback((reason = SESSION_END_REASON.LOGOUT) => {
    setUser(null)
    setToken(null)
    clearAuthStorage()
    try {
      sessionStorage.setItem('tutorspace_session_reason', reason)
    } catch {
      /* ignore */
    }
    const q =
      reason && reason !== SESSION_END_REASON.LOGOUT
        ? `?reason=${encodeURIComponent(reason)}`
        : ''
    window.location.href = `/login${q}`
  }, [])

  const isAuthenticated = useCallback(() => {
    return !!(user && token)
  }, [user, token])

  const contextValue = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
