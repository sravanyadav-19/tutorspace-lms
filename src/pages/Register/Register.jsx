import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, GraduationCap } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/shared/Input'
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

  useEffect(() => {
    const newErrors = {}
    let valid = true
    ;['name','email','password','confirmPassword'].forEach((field) => {
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
        <div className={styles.successContainer}>
          <div className={styles.successIcon}><CheckCircle size={48} color="var(--color-success)" /></div>
          <h2 className={styles.successTitle}>Registration Successful!</h2>
          <p className={styles.successText}>
            Your student account has been created. Once approved by admin, you can login and start learning!
          </p>
          <div className={styles.successSteps}>
            <div className={styles.step}><span className={styles.stepNum}>1</span><span className={styles.stepText}>Wait for admin to approve your account</span></div>
            <div className={styles.step}><span className={styles.stepNum}>2</span><span className={styles.stepText}>Login with your email and password</span></div>
            <div className={styles.step}><span className={styles.stepNum}>3</span><span className={styles.stepText}>Start your learning journey!</span></div>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate('/login')} className={styles.loginBtn}>Go to Login</Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.registerContainer}>
        <div className={styles.registerHeader}>
          <h2 className={styles.registerTitle}>Create Student Account</h2>
          <p className={styles.registerSubtitle}>Register as a student to start your learning journey</p>
        </div>
        {apiError && <div className={styles.errorAlert} role="alert"><AlertCircle size={18} /><span>{apiError}</span></div>}
        <div style={{ background: 'rgba(21, 101, 192, 0.06)', border: '1px solid rgba(21, 101, 192, 0.15)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GraduationCap size={20} color="#1565c0" style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1565c0', fontWeight: 600 }}>Registering as a Student — Teachers are added by Admin</span>
        </div>
        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <Input label="Full Name" type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : ''} required disabled={loading} />
          <Input label="Email Address" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={touched.email ? errors.email : ''} required disabled={loading} />
          <Input label="Password" type="password" name="password" placeholder="Create a password (min 6 chars)" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={touched.password ? errors.password : ''} required disabled={loading} />
          <PasswordStrength password={formData.password} />
          <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={touched.confirmPassword ? errors.confirmPassword : ''} required disabled={loading} />
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isValid} className={styles.submitButton}>
            {loading ? 'Creating Account...' : 'Create Student Account'}
          </Button>
        </form>
        <div className={styles.loginPrompt}>
          <p className={styles.loginText}>Already have an account? <Link to="/login" className={styles.loginLink}>Sign in here</Link></p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Register