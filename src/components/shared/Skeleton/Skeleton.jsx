import React from 'react'
import styles from './Skeleton.module.css'

export const SkeletonBox = ({ width = '100%', height = '20px' }) => {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard} aria-hidden="true" role="presentation">
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonHeaderText}>
          <SkeletonBox width="60%" height="18px" />
          <SkeletonBox width="40%" height="14px" />
        </div>
      </div>
      <div className={styles.skeletonBody}>
        <SkeletonBox width="100%" height="14px" />
        <SkeletonBox width="80%" height="14px" />
        <SkeletonBox width="60%" height="14px" />
      </div>
    </div>
  )
}

export const SkeletonStatCard = () => {
  return (
    <div className={styles.skeletonStatCard} aria-hidden="true" role="presentation">
      <SkeletonBox width="40px" height="40px" />
      <div className={styles.skeletonStatContent}>
        <SkeletonBox width="60px" height="32px" />
        <SkeletonBox width="80px" height="14px" />
      </div>
    </div>
  )
}

export const SkeletonGrid = ({ count = 4, type = 'card' }) => {
  return (
    <div
      className={`${styles.skeletonGrid} ${type === 'stat' ? styles.statGrid : ''}`}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        type === 'stat' ? <SkeletonStatCard key={i} /> : <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default SkeletonGrid