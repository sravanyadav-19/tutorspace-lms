import React from 'react'
import { BookOpen, ClipboardList, Megaphone, FolderOpen } from 'lucide-react'
import styles from './AuthLayout.module.css'

const features = [
  { Icon: BookOpen, text: 'Manage classes effortlessly' },
  { Icon: ClipboardList, text: 'Create and take quizzes' },
  { Icon: Megaphone, text: 'Stay connected with announcements' },
  { Icon: FolderOpen, text: 'Share materials seamlessly' }
]

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      {/* Left Side — Branding */}
      <aside
        className={styles.brandSide}
        role="complementary"
        aria-label="Platform branding"
      >
        <div className={styles.brandContent}>
          <h1 className={styles.brandName}>TutorSpace</h1>
          <p className={styles.brandTagline}>
            Your warm, approachable learning platform
          </p>
          <div className={styles.brandFeatures}>
            {features.map(({ Icon, text }, i) => (
              <div key={i} className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
          <div className={styles.brandFooter}>
            <p className={styles.brandVersion}>TutorSpace LMS v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Right Side — Form */}
      <main
        className={`${styles.formSide} page-fade-in`}
        id="main-content"
        role="main"
        aria-label="Authentication form"
        tabIndex={-1}
      >
        <div className={styles.formContainer}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default AuthLayout