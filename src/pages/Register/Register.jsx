import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, GraduationCap, Eye, EyeOff, UserPlus, ArrowRight, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Button from '../../components/shared/Button'
import PasswordStrength from '../../components/shared/PasswordStrength/PasswordStrength'
import { authAPI } from '../../services/api'
import { validateField } from '../../utils/validation'
import styles from './Register.module.css'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const newErrors = {}
    let valid = true
    ;['name', 'email', 'password', 'confirmPassword'].forEach((field) => {
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
    setTouched({ name: true, email: true, password: true, confirmPassword: true })
    if (!isValid) return
    setLoading(true)
    setApiError('')
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'student'
      })
      if (response.data.success) setSuccess(true)
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Registration failed. Please try again.'
      setApiError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className={styles.registerWrapper}>
          <div className={styles.successCard}>
            <div className={styles.successGlow} />
            <div className={styles.successIconWrapper}>
              <CheckCircle size={48} className={styles.successIcon} />
            </div>
            <h2 className={styles.successTitle}>Registration Successful!</h2>
            <p className={styles.successText}>
              Your student account has been created and is awaiting admin approval.
            </p>
            <div className={styles.successSteps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepContent}>
                  <span className={styles.stepLabel}>Pending Approval</span>
                  <span className={styles.stepHint}>An admin will review and activate your account</span>
                </span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepContent}>
                  <span className={styles.stepLabel}>Sign In</span>
                  <span className={styles.stepHint}>Use your email and password to log in</span>
                </span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <span className={styles.stepContent}>
                  <span className={styles.stepLabel}>Start Learning</span>
                  <span className={styles.stepHint}>Access classes, quizzes, files, and more</span>
                </span>
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')} className={styles.successBtn}>
              Go to Login <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.registerWrapper}>

        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeBadge}>
            <GraduationCap size={14} />
            <span>Student Registration</span>
          </div>
          <h1 className={styles.welcomeTitle}>Create your account</h1>
          <p className={styles.welcomeText}>
            Join TutorSpace as a student. Teachers are added by administrators — so you're in the right place.
          </p>
        </div>

        {/* Register Card */}
        <div className={styles.registerCard}>
          <div className={styles.cardGlow} />

          {/* Role Notice */}
          <div className={styles.roleNotice}>
            <GraduationCap size={18} />
            <span>You're registering as a Student</span>
          </div>

          {apiError && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={18} />
              <span>{apiError}</span>
            </div>
          )}

          <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reg-name">Full Name</label>
              <div className={`${styles.fieldWrapper} ${touched.name && errors.name ? styles.fieldError : ''} ${touched.name && !errors.name && formData.name ? styles.fieldSuccess : ''}`}>
                <User size={16} className={styles.fieldIcon} />
                <input id="reg-name" type="text" name="name" className={styles.fieldInput} placeholder="John Doe" value={formData.name} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="name" />
              </div>
              {touched.name && errors.name && <span className={styles.fieldHint} role="alert">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reg-email">Email Address</label>
              <div className={`${styles.fieldWrapper} ${touched.email && errors.email ? styles.fieldError : ''} ${touched.email && !errors.email && formData.email ? styles.fieldSuccess : ''}`}>
                <Mail size={16} className={styles.fieldIcon} />
                <input id="reg-email" type="email" name="email" className={styles.fieldInput} placeholder="you@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="email" />
              </div>
              {touched.email && errors.email && <span className={styles.fieldHint} role="alert">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reg-password">Password</label>
              <div className={`${styles.fieldWrapper} ${touched.password && errors.password ? styles.fieldError : ''} ${touched.password && !errors.password && formData.password ? styles.fieldSuccess : ''}`}>
                <Lock size={16} className={styles.fieldIcon} />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} name="password" className={styles.fieldInput} placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="new-password" />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && <span className={styles.fieldHint} role="alert">{errors.password}</span>}
            </div>

            {/* Password Strength */}
            <PasswordStrength password={formData.password} />

            {/* Confirm Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reg-confirm">Confirm Password</label>
              <div className={`${styles.fieldWrapper} ${touched.confirmPassword && errors.confirmPassword ? styles.fieldError : ''} ${touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword ? styles.fieldSuccess : ''}`}>
                <Lock size={16} className={styles.fieldIcon} />
                <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} name="confirmPassword" className={styles.fieldInput} placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="new-password" />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <span className={styles.fieldHint} role="alert">{errors.confirmPassword}</span>}
            </div>

            {/* Submit */}
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isValid} className={styles.submitButton}>
              {loading ? 'Creating Account...' : <><UserPlus size={18} style={{ marginRight: '8px' }} /> Create Student Account</>}
            </Button>
          </form>
        </div>

        {/* Login Prompt */}
        <p className={styles.loginPrompt}>
          Already have an account?{' '}
          <Link to="/login" className={styles.loginLink}>
            Sign in instead <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </Link>
        </p>

      </div>
    </AuthLayout>
  )
}

export default Register