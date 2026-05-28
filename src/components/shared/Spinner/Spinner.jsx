import React from 'react'
import styles from './Spinner.module.css'

const Spinner = ({ size = 16, color = 'currentColor', className = '' }) => {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color
      }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

export default Spinner