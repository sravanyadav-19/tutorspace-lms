import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import ActivityFeed from '../../../components/dashboard/ActivityFeed'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { userAPI, classAPI } from '../../../services/api'
import styles from './AdminDashboard.module.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    pendingUsers: 0,
    activeUsers: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentClasses, setRecentClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch users and classes in parallel
      const [usersRes, classesRes] = await Promise.all([
        userAPI.getAllUsers(),
        classAPI.getAllClasses()
      ])

      const users = usersRes.data.data.users
      const classes = classesRes.data.data.classes

      // Calculate stats
      setStats({
        totalUsers: users.length,
        totalClasses: classes.length,
        pendingUsers: users.filter(
          u => u.status === 'pending'
        ).length,
        activeUsers: users.filter(
          u => u.status === 'active'
        ).length
      })

      // Format recent users for feed
      const formattedUsers = users
        .slice(0, 5)
        .map(u => ({
          icon: u.role.name === 'teacher' ? '👨‍🏫' : '🎓',
          name: u.name,
          meta: `${u.email} • ${u.role.name}`,
          badge: u.status,
          badgeColor: u.status === 'active'
            ? 'success'
            : u.status === 'pending'
              ? 'warning'
              : 'danger',
          time: new Date(u.createdAt)
            .toLocaleDateString()
        }))

      setRecentUsers(formattedUsers)

      // Format recent classes
      const formattedClasses = classes
        .slice(0, 5)
        .map(c => ({
          icon: '📚',
          name: c.name,
          meta: `${c.subject} • ${
            c._count?.enrollments || 0
          } students`,
          badge: c.status,
          badgeColor: c.status === 'active'
            ? 'success'
            : 'warning',
          time: new Date(c.createdAt)
            .toLocaleDateString()
        }))

      setRecentClasses(formattedClasses)

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>⏳</div>
          <p className={styles.loadingText}>
            Loading dashboard...
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.adminDashboard}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Admin Dashboard
            </h1>
            <p className={styles.pageSubtitle}>
              Welcome back, {user?.name}! 
              Here's your platform overview.
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="secondary"
              onClick={fetchDashboardData}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/classes/new')}
            >
              + Create Class
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
            <button
              className={styles.retryBtn}
              onClick={fetchDashboardData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="primary"
            subtitle="Registered on platform"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon="✅"
            color="success"
            subtitle="Currently active"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingUsers}
            icon="⏳"
            color="warning"
            subtitle="Awaiting admin review"
          />
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon="📚"
            color="default"
            subtitle="Active courses"
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
              onClick={() => navigate('/admin/users')}
            >
              <span className={styles.actionIcon}>👥</span>
              <span className={styles.actionLabel}>
                Manage Users
              </span>
              {stats.pendingUsers > 0 && (
                <span className={styles.actionBadge}>
                  {stats.pendingUsers}
                </span>
              )}
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/admin/classes')}
            >
              <span className={styles.actionIcon}>📚</span>
              <span className={styles.actionLabel}>
                Manage Classes
              </span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/admin/classes/new')}
            >
              <span className={styles.actionIcon}>➕</span>
              <span className={styles.actionLabel}>
                Create Class
              </span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={fetchDashboardData}
            >
              <span className={styles.actionIcon}>📊</span>
              <span className={styles.actionLabel}>
                Refresh Data
              </span>
            </button>
          </div>
        </div>

        {/* Activity Feeds */}
        <div className={styles.feedsGrid}>
          <ActivityFeed
            title="👥 Recent Users"
            items={recentUsers}
            emptyMessage="No users registered yet"
          />
          <ActivityFeed
            title="📚 Recent Classes"
            items={recentClasses}
            emptyMessage="No classes created yet"
          />
        </div>

      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
