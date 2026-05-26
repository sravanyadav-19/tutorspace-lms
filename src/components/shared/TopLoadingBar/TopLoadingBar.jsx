import React, { useEffect, useState } from 'react'
import styles from './TopLoadingBar.module.css'

const TopLoadingBar = ({ loading }) => {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let interval
    if (loading) {
      setVisible(true)
      setProgress(20)
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev
          return prev + Math.random() * 10
        })
      }, 300)
    } else if (visible) {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }
    return () => clearInterval(interval)
  }, [loading])

  if (!visible) return null

  return (
    <div
      className={styles.barWrapper}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading progress"
      aria-busy={loading}
    >
      <div
        className={styles.bar}
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

export default TopLoadingBar