import React from 'react'
import styles from './AuthLayout.module.css'

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      {/* Left Side - Branding */}
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <h1 className={styles.brandName}>TutorSpace</h1>
          <p className={styles.brandTagline}>
            Your warm, approachable learning platform
          </p>
          <div className={styles.brandFeatures}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📚</span>
              <span className={styles.featureText}>
                Manage classes effortlessly
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📝</span>
              <span className={styles.featureText}>
                Create and take quizzes
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📢</span>
              <span className={styles.featureText}>
                Stay connected with announcements
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📁</span>
              <span className={styles.featureText}>
                Share materials seamlessly
              </span>
            </div>
          </div>
          <div className={styles.brandFooter}>
            <p className={styles.brandDay}>Day 4/50 - Building in Public 🚀</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
