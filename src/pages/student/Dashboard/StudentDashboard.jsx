import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { classAPI } from '../../../services/api'
import styles from './StudentDashboard.module.css'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalClasses: 0,
    totalAnnouncements: 0,
    totalQuizzes: 0
  })
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getStudentClasses()
      const studentClasses = res.data.data.classes

      setClasses(studentClasses)

      const totalAnnouncements = studentClasses.reduce(
        (sum, cls) => sum + (cls._count?.announcements || 0), 0
      )
      const totalQuizzes = studentClasses.reduce(
        (sum, cls) => sum + (cls._count?.quizzes || 0), 0
      )

      setStats({
        totalClasses: studentClasses.length,
        totalAnnouncements,
        totalQuizzes
      })
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Student dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>⏳</div>
          <p>Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.studentDashboard}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p className={styles.pageSubtitle}>
              Here's your learning overview for today.
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchStudentData}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>⚠️ {error}</div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard
            title="My Classes"
            value={stats.totalClasses}
            icon="📚"
            color="primary"
            subtitle="Enrolled classes"
          />
          <StatCard
            title="Announcements"
            value={stats.totalAnnouncements}
            icon="📢"
            color="warning"
            subtitle="From your teachers"
          />
          <StatCard
            title="Quizzes"
            value={stats.totalQuizzes}
            icon="📝"
            color="success"
            subtitle="Available quizzes"
          />
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/classes')}
            >
              <span className={styles.actionIcon}>📚</span>
              <span className={styles.actionLabel}>My Classes</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/announcements')}
            >
              <span className={styles.actionIcon}>📢</span>
              <span className={styles.actionLabel}>Announcements</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/quizzes')}
            >
              <span className={styles.actionIcon}>📝</span>
              <span className={styles.actionLabel}>Take Quiz</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/results')}
            >
              <span className={styles.actionIcon}>📊</span>
              <span className={styles.actionLabel}>My Results</span>
            </button>
          </div>
        </div>

        {/* Classes Overview */}
        {classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>No Classes Yet</h3>
            <p className={styles.emptyText}>
              You haven't been enrolled in any classes yet.
              Contact your administrator.
            </p>
          </div>
        ) : (
          <div className={styles.classesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📚 My Classes</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/student/classes')}
              >
                View All →
              </Button>
            </div>

            <div className={styles.classesGrid}>
              {classes.slice(0, 3).map(cls => (
                <div
                  key={cls.id}
                  className={styles.classCard}
                  onClick={() => navigate(`/student/classes/${cls.id}`)}
                >
                  <div className={styles.classIcon}>📚</div>
                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>{cls.name}</h3>
                    <p className={styles.classSubject}>{cls.subject}</p>
                    <div className={styles.classStats}>
                      <span className={styles.statItem}>
                        📢 {cls._count?.announcements || 0} announcements
                      </span>
                      <span className={styles.statItem}>
                        📝 {cls._count?.quizzes || 0} quizzes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
