import React, { useEffect, useState } from 'react'
import { BookOpen, ClipboardList, Megaphone, FolderOpen, CheckCircle } from 'lucide-react'
import styles from './AuthLayout.module.css'

const features = [
  { Icon: BookOpen, text: 'Manage classes effortlessly', delay: 0 },
  { Icon: ClipboardList, text: 'Create and take quizzes', delay: 150 },
  { Icon: Megaphone, text: 'Stay connected with announcements', delay: 300 },
  { Icon: FolderOpen, text: 'Share materials seamlessly', delay: 450 }
]

const AuthLayout = ({ children }) => {
  const [featuresVisible, setFeaturesVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFeaturesVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.authLayout}>
      {/* Left Side — Branding */}
      <aside
        className={styles.brandSide}
        role="complementary"
        aria-label="Platform branding"
      >
        {/* Animated Gradient Background */}
        <div className={styles.brandBg}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
          <div className={styles.gradientOrb3} />
          <div className={styles.dotGrid} />
          <div className={styles.shapeRing} />
        </div>

        <div className={styles.brandContent}>
          {/* Logo + Badge */}
          {/* <div className={styles.brandHeader}>
            <div className={styles.logoMark}>
              <BookOpen size={28} />
            </div>
            <span className={styles.versionBadge}>v1.0</span>
          </div> */}

          {/* Hero Text */}
          <div className={styles.brandHero}>
            <h1 className={styles.brandName}>TutorSpace</h1>
            <div className={styles.brandTaglineWrapper}>
              <span className={styles.taglineAccent} />
              <p className={styles.brandTagline}>
                Your warm, approachable learning platform — built for teachers and students who care.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className={styles.brandFeatures}>
            {features.map(({ Icon, text, delay }, i) => (
              <div
                key={i}
                className={`${styles.feature} ${featuresVisible ? styles.featureVisible : ''}`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <span className={styles.featureIcon} aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className={styles.featureText}>{text}</span>
              </div>
            ))}
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