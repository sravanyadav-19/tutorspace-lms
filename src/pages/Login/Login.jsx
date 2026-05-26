import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import { validateField } from '../../utils/validation'
import styles from './Login.module.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    const newErrors = {}
    let valid = true
    ;['email','password'].forEach((field) => {
      const error = validateField(field, formData[field], formData)
      if (error) { newErrors[field] = error; valid = false }
    })
    setErrors(newErrors)
    setIsValid(valid)
  }, [formData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setApiError('')
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!isValid) return
    setLoading(true)
    setApiError('')
    try {
      const response = await authAPI.login(formData)
      if (response.data.success) {
        const { user, token } = response.data.data
        login(user, token)
        switch (user.role) {
          case 'admin': navigate('/admin/dashboard'); break
          case 'teacher': navigate('/teacher/dashboard'); break
          default: navigate('/dashboard')
        }
      }
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Login failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  const setDemo = (email, password) => {
    setFormData({ email, password })
    setTouched({ email: true, password: true })
  }

  return (
    <AuthLayout>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <h2 className={styles.loginTitle}>Welcome back!</h2>
          <p className={styles.loginSubtitle}>Sign in to your TutorSpace account</p>
        </div>

        {apiError && (
          <div className={styles.errorAlert} role="alert">
            <span className={styles.errorIcon}><PageIcon name="alert" /></span>
            <span>{apiError}</span>
          </div>
        )}

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ''}
            required
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ''}
            required
            disabled={loading}
          />
          <div className={styles.forgotPassword}>
            <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={loading || !isValid} className={styles.submitButton}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.registerPrompt}>
          <p className={styles.registerText}>
            Don't have an account? <Link to="/register" className={styles.registerLink}>Create one here</Link>
          </p>
        </div>

        {/* Collapsible Demo Accounts — hidden by default for clean portfolio look */}
        <div className={styles.demoSection}>
          <button
            type="button"
            className={styles.demoToggle}
            onClick={() => setShowDemo(!showDemo)}
          >
            <ChevronDown size={16} className={showDemo ? styles.demoToggleOpen : ''} />
            <span>Demo Accounts</span>
          </button>
          {showDemo && (
            <div className={styles.demoAccounts}>
              <button type="button" className={styles.demoBtn} onClick={() => setDemo('admin@tutorspace.com', 'admin123')}>Admin</button>
              <button type="button" className={styles.demoBtn} onClick={() => setDemo('teacher@tutorspace.com', 'teacher123')}>Teacher</button>
              <button type="button" className={styles.demoBtn} onClick={() => setDemo('student@tutorspace.com', 'student123')}>Student</button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}

export default Login
