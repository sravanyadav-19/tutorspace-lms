import React from 'react'
import Spinner from '../Spinner/Spinner'
import styles from './Button.module.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props 
}) => {
  const isDisabled = disabled || loading

  const buttonClass = [
    styles.button,
    styles[`button-${variant}`],
    styles[`button-${size}`],
    isDisabled && styles['button-disabled'],
    loading && styles['button-loading'],
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}

export default Button