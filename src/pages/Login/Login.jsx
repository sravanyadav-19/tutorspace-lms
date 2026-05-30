import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Crown, Target, GraduationCap, LogIn, ArrowRight } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
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
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const newErrors = {}
    let valid = true
    ;['email', 'password'].forEach((field) => {
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
        'Invalid email or password. Please try again.'
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
      <div className={styles.loginWrapper}>

        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeBadge}>
            <span className={styles.badgeDot} />
            TutorSpace LMS
          </div>
          <h1 className={styles.welcomeTitle}>Welcome back</h1>
          <p className={styles.welcomeText}>
            Pick up right where you left off. Sign in to access your classes, files, and quizzes.
          </p>
        </div>

        {/* Login Card */}
        <div className={styles.loginCard}>
          <div className={styles.cardGlow} />

          {apiError && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={18} />
              <span>{apiError}</span>
            </div>
          )}

          <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-email">
                Email Address
              </label>
              <div className={`${styles.fieldWrapper} ${touched.email && errors.email ? styles.fieldError : ''} ${touched.email && !errors.email && formData.email ? styles.fieldSuccess : ''}`}>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className={styles.fieldInput}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <span className={styles.fieldHint} role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel} htmlFor="login-password">
                  Password
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>Forgot?</Link>
              </div>
              <div className={`${styles.fieldWrapper} ${touched.password && errors.password ? styles.fieldError : ''} ${touched.password && !errors.password && formData.password ? styles.fieldSuccess : ''}`}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={styles.fieldInput}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className={styles.fieldHint} role="alert">{errors.password}</span>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !isValid}
              className={styles.submitButton}
            >
              {loading ? 'Signing in...' : <><LogIn size={18} style={{ marginRight: '8px' }} /> Sign In</>}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>quick demo access</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Demo Cards */}
          <div className={styles.demoGrid}>
            <button
              type="button"
              className={`${styles.demoCard} ${styles.demoCardAdmin}`}
              onClick={() => setDemo('admin@tutorspace.com', 'admin123')}
            >
              <span className={styles.demoIcon}><Crown size={18} /></span>
              <span className={styles.demoLabel}>Admin</span>
            </button>
            <button
              type="button"
              className={`${styles.demoCard} ${styles.demoCardTeacher}`}
              onClick={() => setDemo('teacher@tutorspace.com', 'teacher123')}
            >
              <span className={styles.demoIcon}><Target size={18} /></span>
              <span className={styles.demoLabel}>Teacher</span>
            </button>
            <button
              type="button"
              className={`${styles.demoCard} ${styles.demoCardStudent}`}
              onClick={() => setDemo('student@tutorspace.com', 'student123')}
            >
              <span className={styles.demoIcon}><GraduationCap size={18} /></span>
              <span className={styles.demoLabel}>Student</span>
            </button>
          </div>
          <p className={styles.demoHint}>Click any role to auto-fill demo credentials</p>
        </div>

        {/* Register Link */}
        <p className={styles.registerPrompt}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.registerLink}>
            Create a student account <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </Link>
        </p>

      </div>
    </AuthLayout>
  )
}

export default Login