import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI } from '../../../services/api'
import styles from './StudentClasses.module.css'

const StudentClasses = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await classAPI.getStudentClasses()
      setClasses(res.data.data.classes || [])
    } catch (err) {
      setError('Failed to load your classes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.classesPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📚 My Classes</h1>
            <p className={styles.pageSubtitle}>
              View all classes you are enrolled in
            </p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}>
            🔄 Refresh
          </Button>
        </div>

        {error && (
          <div className={styles.errorBanner}>⚠️ {error}</div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading your classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>No Classes Found</h3>
            <p className={styles.emptyText}>
              You are not enrolled in any classes yet.
            </p>
          </div>
        ) : (
          <div className={styles.classesGrid}>
            {classes.map(cls => (
              <div key={cls.id} className={styles.classCard}>
                <div className={styles.classIcon}>📚</div>

                <div className={styles.classInfo}>
                  <h3 className={styles.className}>{cls.name}</h3>
                  <p className={styles.classSubject}>{cls.subject}</p>

                  {cls.description && (
                    <p className={styles.classDescription}>
                      {cls.description}
                    </p>
                  )}

                  <div className={styles.classStats}>
                    <span className={styles.statItem}>
                      📢 {cls._count?.announcements || 0} announcements
                    </span>
                    <span className={styles.statItem}>
                      📝 {cls._count?.quizzes || 0} quizzes
                    </span>
                    <span className={styles.statItem}>
                      👥 {cls._count?.enrollments || 0} enrolled
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentClasses
