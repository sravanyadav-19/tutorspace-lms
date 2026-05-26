import React from 'react'
import styles from './Button.module.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props 
}) => {
  const buttonClass = [
    styles.button,
    styles[`button-${variant}`],
    styles[`button-${size}`],
    disabled && styles['button-disabled'],
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button