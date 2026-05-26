import React from 'react'
import styles from './StatCard.module.css'

const StatCard = ({ 
  title, 
  value, 
  Icon, 
  color = 'default',
  subtitle 
}) => {
  return (
    <div
      className={`${styles.statCard} ${styles[color]}`}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <div className={styles.statHeader}>
        <span className={styles.statIcon} aria-hidden="true">
          {Icon && <Icon size={20} strokeWidth={2} />}
        </span>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
      {subtitle && (
        <div className={styles.statSubtitle}>{subtitle}</div>
      )}
    </div>
  )
}

export default StatCard