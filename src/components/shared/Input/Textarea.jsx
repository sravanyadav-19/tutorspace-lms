import React from 'react'
import styles from './Input.module.css'

const Textarea = ({ 
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  id,
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  
  const textareaClass = [
    styles.input,
    styles.textarea,
    error && styles['input-error'],
    disabled && styles['input-disabled'],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label 
          htmlFor={textareaId} 
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={textareaClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        {...props}
      />
      
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}

export default Textarea
