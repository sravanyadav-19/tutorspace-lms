import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react'
import AuthLayout from '../../../components/layout/AuthLayout'
import Button from '../../../components/shared/Button'
import { validateField } from '../../../utils/validation'
import { authAPI } from '../../../services/api'
import styles from './ForgotPassword.module.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [sent, setSent] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const err = validateField('email', email)
    setError(err || '')
    setIsValid(!err && email.trim() !== '')
  }, [email])

  const handleChange = (e) => { setEmail(e.target.value); setApiError('') }
  const handleBlur = () => setTouched(true)

  const handleSubmit = async (e) => {
    e.preventDefault(); setTouched(true)
    if (!isValid) return
    setLoading(true); setApiError('')
    try { await authAPI.forgotPassword(email.trim()); setSent(true) }
    catch (err) { setApiError(err.response?.data?.message || 'Failed to send reset email.') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}><CheckCircle size={40} className={styles.icon} /></div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.message}>If an account exists for <strong>{email}</strong>, we've sent a password reset link.</p>
            <p className={styles.hint}>Check your spam folder if you don't see it within a few minutes.</p>
            <Link to="/login" className={styles.backLink}><ArrowLeft size={14} /> Back to Login</Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardGlow} />
          <div className={styles.iconWrapper}><Mail size={28} className={styles.icon} /></div>
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.message}>Enter your email address and we'll send you a link to reset your password.</p>
          {apiError && <div className={styles.errorAlert} role="alert"><AlertCircle size={18} /><span>{apiError}</span></div>}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="forgot-email">Email Address</label>
              <div className={`${styles.fieldWrapper} ${touched && error ? styles.fieldError : ''}`}>
                <Mail size={16} className={styles.fieldIcon} />
                <input id="forgot-email" type="email" className={styles.fieldInput} placeholder="you@example.com" value={email} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="email" />
              </div>
              {touched && error && <span className={styles.fieldHint} role="alert">{error}</span>}
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isValid} className={styles.submitButton}>
              {loading ? 'Sending...' : <><Send size={18} style={{ marginRight: '8px' }} /> Send Reset Link</>}
            </Button>
          </form>
          <Link to="/login" className={styles.backLink}><ArrowLeft size={14} /> Back to Login</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ForgotPassword