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
      case 'success': return <CheckCircle size={20} />
      case 'error': return <XCircle size={20} />
      case 'warning': return <AlertCircle size={20} />
      default: return <CheckCircle size={20} />
    }
  }

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.toastIcon}>{getIcon()}</span>
      <p className={styles.toastMessage}>{message}</p>
      <button className={styles.toastClose} onClick={() => onClose(id)}>
        <X size={16} />
      </button>
    </div>
  )
}

export default Toast
