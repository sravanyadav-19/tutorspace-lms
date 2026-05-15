import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage ONCE on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('tutorspace_token')
    const savedUser = localStorage.getItem('tutorspace_user')

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        // Check if token is not expired (simple check)
        const base64Url = savedToken.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        if (payload.exp * 1000 > Date.now()) {
          setToken(savedToken)
          setUser(userData)
        } else {
          // Token expired, clear
          localStorage.removeItem('tutorspace_token')
          localStorage.removeItem('tutorspace_user')
        }
      } catch (e) {
        console.error('Corrupted auth data, clearing', e)
        localStorage.removeItem('tutorspace_token')
        localStorage.removeItem('tutorspace_user')
      }
    }
    setLoading(false)
  }, [])

  // Clear localStorage only when the window is actually being closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('tutorspace_token')
      localStorage.removeItem('tutorspace_user')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('tutorspace_token', authToken)
    localStorage.setItem('tutorspace_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('tutorspace_token')
    localStorage.removeItem('tutorspace_user')
    window.location.href = '/login'
  }

  const isAuthenticated = () => {
    return !!(user && token)
  }

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
