import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import AuthLayout from '../../../components/layout/AuthLayout'
import Button from '../../../components/shared/Button'
import PasswordStrength from '../../../components/shared/PasswordStrength/PasswordStrength'
import { validateField } from '../../../utils/validation'
import { authAPI } from '../../../services/api'
import styles from './ResetPassword.module.css'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const newErrors = {}; let valid = true
    const passErr = validateField('password', password)
    const confirmErr = validateField('confirmPassword', confirmPassword, { password })
    if (passErr) { newErrors.password = passErr; valid = false }
    if (confirmErr) { newErrors.confirmPassword = confirmErr; valid = false }
    if (!password || !confirmPassword) valid = false
    setErrors(newErrors); setIsValid(valid)
  }, [password, confirmPassword])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'password') setPassword(value); else setConfirmPassword(value)
    setApiError('')
  }
  const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setTouched({ password: true, confirmPassword: true })
    if (!isValid) return
    setLoading(true); setApiError('')
    try { await authAPI.resetPassword(token, password); setSuccess(true) }
    catch (err) { setApiError(err.response?.data?.message || 'Failed to reset password. Link may have expired.') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}><CheckCircle size={40} className={styles.icon} /></div>
            <h1 className={styles.title}>Password Reset!</h1>
            <p className={styles.message}>Your password has been updated. Sign in with your new password.</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')} className={styles.submitButton}>Go to Login</Button>
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
          <div className={styles.iconWrapper}><KeyRound size={28} className={styles.icon} /></div>
          <h1 className={styles.title}>Set new password</h1>
          <p className={styles.message}>Enter your new password below. Must be at least 6 characters.</p>
          {apiError && <div className={styles.errorAlert} role="alert"><AlertCircle size={18} /><span>{apiError}</span></div>}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reset-password">New Password</label>
              <div className={`${styles.fieldWrapper} ${touched.password && errors.password ? styles.fieldError : ''}`}>
                <Lock size={16} className={styles.fieldIcon} />
                <input id="reset-password" type={showPassword ? 'text' : 'password'} name="password" className={styles.fieldInput} placeholder="Min. 6 characters" value={password} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="new-password" />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {touched.password && errors.password && <span className={styles.fieldHint} role="alert">{errors.password}</span>}
            </div>
            <PasswordStrength password={password} />
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="reset-confirm">Confirm Password</label>
              <div className={`${styles.fieldWrapper} ${touched.confirmPassword && errors.confirmPassword ? styles.fieldError : ''}`}>
                <Lock size={16} className={styles.fieldIcon} />
                <input id="reset-confirm" type={showConfirm ? 'text' : 'password'} name="confirmPassword" className={styles.fieldInput} placeholder="Re-enter your password" value={confirmPassword} onChange={handleChange} onBlur={handleBlur} disabled={loading} autoComplete="new-password" />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <span className={styles.fieldHint} role="alert">{errors.confirmPassword}</span>}
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isValid} className={styles.submitButton}>
              {loading ? 'Resetting...' : <><KeyRound size={18} style={{ marginRight: '8px' }} /> Reset Password</>}
            </Button>
          </form>
          <Link to="/login" className={styles.backLink}><ArrowLeft size={14} /> Back to Login</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword