import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import styles from './Toast.module.css'

const Toast = ({ id, type = 'success', message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} aria-hidden="true" />
      case 'error': return <XCircle size={20} aria-hidden="true" />
      case 'warning': return <AlertCircle size={20} aria-hidden="true" />
      default: return <CheckCircle size={20} aria-hidden="true" />
    }
  }

  const roleMap = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status'
  }

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role={roleMap[type] || 'status'}
      aria-live="polite"
    >
      <span className={styles.toastIcon} aria-hidden="true">{getIcon()}</span>
      <p className={styles.toastMessage}>{message}</p>
      <button
        className={styles.toastClose}
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

export default Toast