import React from 'react'
import styles from './StatCard.module.css'

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'default',
  subtitle 
}) => {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statHeader}>
        <span className={styles.statIcon}>{icon}</span>
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
