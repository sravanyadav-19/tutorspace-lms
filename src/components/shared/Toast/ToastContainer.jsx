import React from 'react'
import Toast from './Toast'
import styles from './ToastContainer.module.css'

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}

export default ToastContainer
