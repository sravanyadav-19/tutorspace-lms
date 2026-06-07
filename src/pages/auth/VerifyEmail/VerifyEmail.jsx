import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react'
import AuthLayout from '../../../components/layout/AuthLayout'
import Button from '../../../components/shared/Button'
import { authAPI } from '../../../services/api'
import styles from './VerifyEmail.module.css'

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token)
        if (res.data.success) setStatus('success')
        else { setStatus('error'); setError(res.data.message) }
      } catch (err) {
        setStatus('error')
        setError(err.response?.data?.message || 'Verification failed. The link may have expired.')
      }
    }
    if (token) verify()
  }, [token])

  return (
    <AuthLayout>
      <div className={styles.container}>
        <div className={styles.card}>

          {status === 'loading' && (
            <>
              <div className={styles.iconWrapper}><Loader2 size={40} className={`${styles.icon} ${styles.spin}`} /></div>
              <h1 className={styles.title}>Verifying your email</h1>
              <p className={styles.message}>Please wait while we confirm your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className={`${styles.iconWrapper} ${styles.successBg}`}><CheckCircle size={40} className={styles.successIcon} /></div>
              <h1 className={styles.title}>Email Verified!</h1>
              <p className={styles.message}>Your email has been successfully verified. Once approved by an admin, you can log in and start learning.</p>
              <div className={styles.steps}>
                <div className={styles.step}><span className={styles.stepNum}>1</span><span>Wait for admin approval</span></div>
                <div className={styles.step}><span className={styles.stepNum}>2</span><span>Log in with your credentials</span></div>
                <div className={styles.step}><span className={styles.stepNum}>3</span><span>Start your learning journey</span></div>
              </div>
              <Button variant="primary" size="lg" onClick={() => navigate('/login')} className={styles.submitButton}>
                Go to Login <ArrowRight size={16} />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className={`${styles.iconWrapper} ${styles.errorBg}`}><XCircle size={40} className={styles.errorIcon} /></div>
              <h1 className={styles.title}>Verification Failed</h1>
              <p className={styles.message}>{error || 'Something went wrong.'}</p>
              <p className={styles.hint}>The verification link may have expired or already been used.</p>
              <Link to="/login" className={styles.loginLink}>Return to Login</Link>
            </>
          )}

        </div>
      </div>
    </AuthLayout>
  )
}

export default VerifyEmail