import React from 'react'
import styles from './Input.module.css'

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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  const inputClass = [
    styles.input,
    error && styles['input-error'],
    disabled && styles['input-disabled'],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={styles.label}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
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

export default Input
