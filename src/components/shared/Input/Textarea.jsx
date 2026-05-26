import React from 'react'
import styles from './Input.module.css'

let textareaCounter = 0

const Textarea = ({ 
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  id,
  rows = 4,
  ...props 
}) => {
  const textareaId = id || `textarea-${++textareaCounter}`
  const errorId = `${textareaId}-error`
  const helperId = `${textareaId}-helper`
  
  const textareaClass = [
    styles.textarea,
    error && styles['input-error'],
    disabled && styles['input-disabled'],
    className
  ].filter(Boolean).join(' ')

  const describedBy = [
    error ? errorId : null,
    !error && helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label 
          htmlFor={textareaId} 
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={textareaClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        {...props}
      />
      
      {error && (
        <span className={styles.error} role="alert" id={errorId}>
          {error}
        </span>
      )}
      
      {helperText && !error && (
        <span className={styles.helperText} id={helperId}>
          {helperText}
        </span>
      )}
    </div>
  )
}

export default Textarea