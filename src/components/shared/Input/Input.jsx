import React from 'react'
import styles from './Input.module.css'

let inputCounter = 0

const Input = ({ 
  label,
  type = 'text',
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
  ...props 
}) => {
  const inputId = id || `input-${++inputCounter}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  
  const inputClass = [
    styles.input,
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
          htmlFor={inputId} 
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
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

export default Input