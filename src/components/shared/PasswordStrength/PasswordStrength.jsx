import React from 'react'
import { getPasswordStrength } from '../../../utils/validation'
import styles from './PasswordStrength.module.css'

const PasswordStrength = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password)
  if (!password) return null
  const segments = [0, 1, 2, 3]
  return (
    <div className={styles.container}>
      <div className={styles.bars}>
        {segments.map((i) => (
          <div
            key={i}
            className={`${styles.bar} ${i < score ? styles.active : ''}`}
            style={{ backgroundColor: i < score ? color : 'transparent' }}
          />
        ))}
      </div>
      <span className={styles.label} style={{ color }}>
        {label}
      </span>
    </div>
  )
}

export default PasswordStrength
