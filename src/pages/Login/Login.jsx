import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import styles from './Login.module.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setApiError('')
  }

  // Validate form
  const validate = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    return newErrors
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError('')

    try {
      const response = await authAPI.login(formData)

      if (response.data.success) {
        const { user, token } = response.data.data
        login(user, token)

        // Redirect based on role
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard')
            break
          case 'teacher':
            navigate('/teacher/dashboard')
            break
          case 'student':
          default:
            navigate('/dashboard')
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 
                      'Login failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className={styles.loginContainer}>
        {/* Header */}
        <div className={styles.loginHeader}>
          <h2 className={styles.loginTitle}>Welcome back!</h2>
          <p className={styles.loginSubtitle}>
            Sign in to your TutorSpace account
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className={styles.errorAlert} role="alert">
            <span className={styles.errorIcon}>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          className={styles.loginForm}
          onSubmit={handleSubmit}
          noValidate
        >
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
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
            error={errors.password}
            required
            disabled={loading}
          />

          {/* Forgot Password Link */}
          <div className={styles.forgotPassword}>
            <Link
              to="/forgot-password"
              className={styles.forgotLink}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Register Link */}
        <div className={styles.registerPrompt}>
          <p className={styles.registerText}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.registerLink}>
              Create one here
            </Link>
          </p>
        </div>

        {/* Demo Accounts */}
        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Demo Accounts:</p>
          <div className={styles.demoAccounts}>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => setFormData({
                email: 'admin@tutorspace.com',
                password: 'admin123'
              })}
            >
              Admin
            </button>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => setFormData({
                email: 'teacher@tutorspace.com',
                password: 'teacher123'
              })}
            >
              Teacher
            </button>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => setFormData({
                email: 'student@tutorspace.com',
                password: 'student123'
              })}
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Login
