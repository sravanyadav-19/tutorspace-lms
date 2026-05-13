import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import { authAPI } from '../../services/api'
import styles from './Register.module.css'

const Register = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setApiError('')
  }

  // Validate form
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError('')

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })

      if (response.data.success) {
        setSuccess(true)
      }
    } catch (error) {
      const message = error.response?.data?.message ||
                      'Registration failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <AuthLayout>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>
            Registration Successful!
          </h2>
          <p className={styles.successText}>
            Please check your email to verify your account.
            After verification, an admin will approve your access.
          </p>
          <div className={styles.successSteps}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepText}>
                Check your email inbox
              </span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepText}>
                Click the verification link
              </span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepText}>
                Wait for admin approval
              </span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>4</span>
              <span className={styles.stepText}>
                Login and start learning!
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className={styles.loginBtn}
          >
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.registerContainer}>
        {/* Header */}
        <div className={styles.registerHeader}>
          <h2 className={styles.registerTitle}>Create Account</h2>
          <p className={styles.registerSubtitle}>
            Join TutorSpace and start your learning journey
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* Register Form */}
        <form
          className={styles.registerForm}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            disabled={loading}
          />

          {/* Email */}
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

          {/* Role Selection */}
          <div className={styles.roleSection}>
            <label className={styles.roleLabel}>
              I am a: <span className={styles.required}>*</span>
            </label>
            <div className={styles.roleOptions}>
              <button
                type="button"
                className={`${styles.roleOption} ${
                  formData.role === 'student' 
                    ? styles.roleOptionActive 
                    : ''
                }`}
                onClick={() => setFormData(
                  prev => ({ ...prev, role: 'student' })
                )}
              >
                <span className={styles.roleOptionIcon}>🎓</span>
                <span className={styles.roleOptionText}>Student</span>
              </button>
              <button
                type="button"
                className={`${styles.roleOption} ${
                  formData.role === 'teacher' 
                    ? styles.roleOptionActive 
                    : ''
                }`}
                onClick={() => setFormData(
                  prev => ({ ...prev, role: 'teacher' })
                )}
              >
                <span className={styles.roleOptionIcon}>👨‍🏫</span>
                <span className={styles.roleOptionText}>Teacher</span>
              </button>
            </div>
          </div>

          {/* Password */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Create a password (min 6 chars)"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            disabled={loading}
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            disabled={loading}
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Login Link */}
        <div className={styles.loginPrompt}>
          <p className={styles.loginText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.loginLink}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Register
