import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import ActivityFeed from '../../../components/dashboard/ActivityFeed'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { classAPI } from '../../../services/api'
import styles from './TeacherDashboard.module.css'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAnnouncements: 0,
    totalQuizzes: 0
  })
  const [classes, setClasses] = useState([])
  const [recentAnnouncements, setRecentAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)

      // Fetch teacher's classes
      const res = await classAPI.getTeacherClasses()
      const teacherClasses = res.data.data.classes

      setClasses(teacherClasses)

      // Calculate stats
      const totalStudents = teacherClasses.reduce(
        (sum, cls) => sum + (cls._count?.enrollments || 0), 0
      )
      const totalAnnouncements = teacherClasses.reduce(
        (sum, cls) => sum + (cls._count?.announcements || 0), 0
      )
      const totalQuizzes = teacherClasses.reduce(
        (sum, cls) => sum + (cls._count?.quizzes || 0), 0
      )

      setStats({
        totalClasses: teacherClasses.length,
        totalStudents,
        totalAnnouncements,
        totalQuizzes
      })

      // Format classes for activity feed
      const classItems = teacherClasses
        .slice(0, 5)
        .map(cls => ({
          icon: '📚',
          name: cls.name,
          meta: `${cls.subject} • ${
            cls._count?.enrollments || 0
          } students`,
          badge: cls.status,
          badgeColor: cls.status === 'active'
            ? 'success'
            : 'warning',
          time: new Date(cls.createdAt)
            .toLocaleDateString()
        }))

      setRecentAnnouncements(classItems)

    } catch (err) {
      setError('Failed to load teacher data')
      console.error('Teacher dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>⏳</div>
          <p className={styles.loadingText}>
            Loading your dashboard...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.teacherDashboard}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p className={styles.pageSubtitle}>
              Here's your teaching overview for today.
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="secondary"
              onClick={fetchTeacherData}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/teacher/announcements/new')}
            >
              📢 New Announcement
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
            <button
              className={styles.retryBtn}
              onClick={fetchTeacherData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard
            title="My Classes"
            value={stats.totalClasses}
            icon="📚"
            color="primary"
            subtitle="Classes you teach"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon="🎓"
            color="success"
            subtitle="Across all classes"
          />
          <StatCard
            title="Announcements"
            value={stats.totalAnnouncements}
            icon="📢"
            color="warning"
            subtitle="Posted by you"
          />
          <StatCard
            title="Quizzes Created"
            value={stats.totalQuizzes}
            icon="📝"
            color="default"
            subtitle="Total assessments"
          />
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>
            ⚡ Quick Actions
          </h2>
          <div className={styles.actionButtons}>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/teacher/classes')}
            >
              <span className={styles.actionIcon}>📚</span>
              <span className={styles.actionLabel}>
                My Classes
              </span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/teacher/announcements')}
            >
              <span className={styles.actionIcon}>📢</span>
              <span className={styles.actionLabel}>
                Post Announcement
              </span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/teacher/files')}
            >
              <span className={styles.actionIcon}>📄</span>
              <span className={styles.actionLabel}>
                Upload Files
              </span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/teacher/quizzes')}
            >
              <span className={styles.actionIcon}>📝</span>
              <span className={styles.actionLabel}>
                Create Quiz
              </span>
            </button>
          </div>
        </div>

        {/* Classes Overview */}
        {classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>
              No Classes Assigned
            </h3>
            <p className={styles.emptyText}>
              You haven't been assigned to any classes yet.
              Contact your administrator for class assignments.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/teacher/profile')}
            >
              Update Profile
            </Button>
          </div>
        ) : (
          <div className={styles.classesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                📚 Your Classes
              </h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/teacher/classes')}
              >
                View All →
              </Button>
            </div>

            <div className={styles.classesGrid}>
              {classes.slice(0, 3).map(cls => (
                <div
                  key={cls.id}
                  className={styles.classCard}
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                >
                  <div className={styles.classIcon}>📚</div>
                  
                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>{cls.name}</h3>
                    <p className={styles.classSubject}>{cls.subject}</p>
                    
                    <div className={styles.classStats}>
                      <span className={styles.statItem}>
                        👥 {cls._count?.enrollments || 0} students
                      </span>
                      <span className={styles.statItem}>
                        📢 {cls._count?.announcements || 0} announcements
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.classActions}>
                    <span className={`
                      ${styles.statusBadge}
                      ${styles[`status-${cls.status}`]}
                    `}>
                      {cls.status}
                    </span>
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

export default TeacherDashboard
