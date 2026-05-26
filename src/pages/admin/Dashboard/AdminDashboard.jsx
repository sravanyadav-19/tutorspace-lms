import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, Clock, BookOpen, PlusCircle, RefreshCw, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import ActivityFeed from '../../../components/dashboard/ActivityFeed'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { userAPI, classAPI } from '../../../services/api'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [usersRes, classesRes] = await Promise.all([
        userAPI.getAllUsers(),
        classAPI.getAllClasses()
      ])

      const users = usersRes.data.data.users
      const classes = classesRes.data.data.classes

      setStats({
        totalUsers: users.length,
        totalClasses: classes.length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        activeUsers: users.filter(u => u.status === 'active').length
      })

      const formattedUsers = users.slice(0, 5).map(u => ({
        icon: u.role.name === 'teacher' ? '👨‍🏫' : '🎓',
        name: u.name,
        meta: `${u.email} • ${u.role.name}`,
        badge: u.status,
        badgeColor: u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'danger',
        time: new Date(u.createdAt).toLocaleDateString()
      }))

      setRecentUsers(formattedUsers)

      const formattedClasses = classes.slice(0, 5).map(c => ({
        icon: '📚',
        name: c.name,
        meta: `${c.subject} • ${c._count?.enrollments || 0} students`,
        badge: c.status,
        badgeColor: c.status === 'active' ? 'success' : 'warning',
        time: new Date(c.createdAt).toLocaleDateString()
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
        <div className={styles.adminDashboard}>
          <div className={styles.pageHeader}>
            <SkeletonCard />
          </div>
          <SkeletonGrid count={4} type="stat" />
          <div style={{ marginTop: '24px' }}>
            <SkeletonGrid count={2} type="card" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.adminDashboard}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Welcome back, {user?.name}! Here's your platform overview.
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchDashboardData}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/classes/new')}>
              <PlusCircle size={16} style={{ marginRight: '6px' }} />
              Create Class
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button className={styles.retryBtn} onClick={fetchDashboardData}>Retry</button>
          </div>
        )}

        <div className={styles.statsGrid}>
          <StatCard title="Total Users" value={stats.totalUsers} Icon={Users} color="primary" subtitle="Registered on platform" />
          <StatCard title="Active Users" value={stats.activeUsers} Icon={UserCheck} color="success" subtitle="Currently active" />
          <StatCard title="Pending Approval" value={stats.pendingUsers} Icon={Clock} color="warning" subtitle="Awaiting admin review" />
          <StatCard title="Total Classes" value={stats.totalClasses} Icon={BookOpen} color="default" subtitle="Active courses" />
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button className={styles.actionBtn} onClick={() => navigate('/admin/users')}>
              <Users size={18} />
              <span className={styles.actionLabel}>Manage Users</span>
              {stats.pendingUsers > 0 && <span className={styles.actionBadge}>{stats.pendingUsers}</span>}
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/admin/classes')}>
              <BookOpen size={18} />
              <span className={styles.actionLabel}>Manage Classes</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/admin/classes/new')}>
              <PlusCircle size={18} />
              <span className={styles.actionLabel}>Create Class</span>
            </button>
            <button className={styles.actionBtn} onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              <span className={styles.actionLabel}>Refresh Data</span>
            </button>
          </div>
        </div>

        <div className={styles.feedsGrid}>
          <ActivityFeed title="Recent Users" items={recentUsers} emptyMessage="No users registered yet" />
          <ActivityFeed title="Recent Classes" items={recentClasses} emptyMessage="No classes created yet" />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
