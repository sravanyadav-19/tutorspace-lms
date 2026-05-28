import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../Button/Button'
import styles from './ConfirmModal.module.css'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  loading = false
}) => {
  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.iconWrapper}>
          <AlertTriangle size={28} className={styles.icon} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '⏳ Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal