import React from 'react'
import PageIcon from '../PageIcon/PageIcon'
import styles from './Button.module.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props 
}) => {
  const buttonClass = [
    styles.button,
    styles[`button-${variant}`],
    styles[`button-${size}`],
    disabled && styles['button-disabled'],
    icon && styles['button-withIcon'],
    className
  ].filter(Boolean).join(' ')

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && (
        <PageIcon 
          name={icon} 
          size={iconSize} 
          strokeWidth={2.5}
          className={styles.buttonIcon} 
        />
      )}
      {children}
    </button>
  )
}

export default Button
