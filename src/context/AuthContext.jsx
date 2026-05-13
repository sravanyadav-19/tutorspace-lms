import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect 
} from 'react'

// ================================
// CREATE CONTEXT
// ================================
const AuthContext = createContext(null)

// ================================
// AUTH PROVIDER
// ================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('tutorspace_token')
    const savedUser = localStorage.getItem('tutorspace_user')

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('tutorspace_token')
        localStorage.removeItem('tutorspace_user')
      }
    }

    setLoading(false)
  }, [])

  // ================================
  // LOGIN FUNCTION
  // ================================
  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('tutorspace_token', authToken)
    localStorage.setItem('tutorspace_user', JSON.stringify(userData))
  }

  // ================================
  // LOGOUT FUNCTION
  // ================================
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('tutorspace_token')
    localStorage.removeItem('tutorspace_user')
    window.location.href = '/login'
  }

  // ================================
  // ROLE CHECKS
  // ================================
  const isAdmin = () => user?.role === 'admin'
  const isTeacher = () => user?.role === 'teacher'
  const isStudent = () => user?.role === 'student'
  const isAuthenticated = () => !!user && !!token

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isTeacher,
    isStudent,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ================================
// CUSTOM HOOK
// ================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
