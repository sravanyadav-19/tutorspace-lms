import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, Clock, BookOpen, PlusCircle, RefreshCw, UserPlus, AlertCircle, ArrowRight, Target, Info, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import ActivityFeed from '../../../components/dashboard/ActivityFeed'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { userAPI, classAPI } from '../../../services/api'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import styles from './AdminDashboard.module.css'
import tm from '../Users/TeacherModal.module.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [stats, setStats] = useState({
    totalUsers: 0, totalClasses: 0, pendingUsers: 0, activeUsers: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentClasses, setRecentClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' })
  const [teacherLoading, setTeacherLoading] = useState(false)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [usersRes, classesRes] = await Promise.all([userAPI.getAllUsers(), classAPI.getAllClasses()])
      const users = usersRes?.data?.data?.users || []
      const classes = classesRes?.data?.data?.classes || []
      setStats({
        totalUsers: users.length, totalClasses: classes.length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        activeUsers: users.filter(u => u.status === 'active').length
      })
      setRecentUsers(users.slice(0, 5).map(u => ({
        icon: u.role?.name === 'teacher' ? 'teacher' : 'student',
        name: u.name, meta: `${u.email} • ${u.role?.name || 'User'}`,
        badge: u.status,
        badgeColor: u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'danger',
        time: new Date(u.createdAt).toLocaleDateString()
      })))
      setRecentClasses(classes.slice(0, 5).map(c => ({
        icon: 'class', name: c.name,
        meta: `${c.subject} • ${c._count?.enrollments || 0} students`,
        badge: c.status,
        badgeColor: c.status === 'active' ? 'success' : 'warning',
        time: new Date(c.createdAt).toLocaleDateString()
      })))
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally { setLoading(false) }
  }

  const handleCreateTeacher = async (e) => {
    e.preventDefault()
    if (!teacherForm.name || !teacherForm.email || !teacherForm.password) {
      toast.error('All fields are required')
      return
    }
    if (teacherForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setTeacherLoading(true)
    try {
      await userAPI.createTeacher(teacherForm)
      toast.success('Teacher account created successfully!')
      setShowTeacherModal(false)
      setTeacherForm({ name: '', email: '', password: '' })
      fetchDashboardData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher')
    } finally {
      setTeacherLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className={styles.adminDashboard}>
          <div className={styles.pageHeader}><SkeletonCard /></div>
          <SkeletonGrid count={4} type="stat" />
          <div style={{ marginTop: '24px' }}><SkeletonGrid count={2} type="card" /></div>
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
            <p className={styles.pageSubtitle}>Welcome back, {user?.name}! Here&apos;s your platform overview.</p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchDashboardData}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowTeacherModal(true)}>
              <UserPlus size={16} style={{ marginRight: '6px' }} /> Create Teacher
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
            <button className={styles.retryBtn} onClick={fetchDashboardData}>Retry</button>
          </div>
        )}

        {stats.pendingUsers > 0 && (
          <div className={styles.pendingAlertBanner}>
            <div className={styles.pendingAlertLeft}>
              <AlertCircle size={20} className={styles.alertIcon} />
              <div>
                <p className={styles.alertTitle}>Pending Student Approvals</p>
                <p className={styles.alertText}>
                  There {stats.pendingUsers === 1 ? 'is 1 student account' : `are ${stats.pendingUsers} student accounts`} waiting for approval to access classes.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/users')}>
              Review Users <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Button>
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
            <button className={styles.actionBtn} onClick={() => setShowTeacherModal(true)}>
              <UserPlus size={18} />
              <span className={styles.actionLabel}>Create Teacher</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/admin/classes')}>
              <BookOpen size={18} />
              <span className={styles.actionLabel}>Manage Classes</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/admin/classes/new')}>
              <PlusCircle size={18} />
              <span className={styles.actionLabel}>Create Class</span>
            </button>
          </div>
        </div>

        <div className={styles.feedsGrid}>
          <ActivityFeed title="Recent Users" items={recentUsers} emptyMessage="No users registered yet" />
          <ActivityFeed title="Recent Classes" items={recentClasses} emptyMessage="No classes created yet" />
        </div>

        {showTeacherModal && (
          <div
            className={tm.overlay}
            onClick={() => setShowTeacherModal(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowTeacherModal(false) }}
            role="dialog"
            aria-modal="true"
            aria-label="Create new teacher"
          >
            <div className={tm.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={tm.title}><Target size={20} style={{ marginRight: '8px' }} /> Create New Teacher</h2>
              <p className={tm.subtitle}>Set up a teacher account. They will use these credentials to login.</p>
              <form onSubmit={handleCreateTeacher} className={tm.form}>
                <div className={tm.fieldGroup}>
                  <label className={tm.fieldLabel}>Full Name</label>
                  <input
                    type="text"
                    className={tm.fieldInput}
                    value={teacherForm.name}
                    aria-label="Teacher full name"
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className={tm.fieldGroup}>
                  <label className={tm.fieldLabel}>Email</label>
                  <input
                    type="email"
                    className={tm.fieldInput}
                    value={teacherForm.email}
                    aria-label="Teacher email address"
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="jane@school.com"
                    required
                  />
                </div>
                <div className={tm.fieldGroup}>
                  <label className={tm.fieldLabel}>Password (min 6 chars)</label>
                  <input
                    type="password"
                    className={tm.fieldInput}
                    value={teacherForm.password}
                    aria-label="Teacher password"
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    placeholder="Type a secure password"
                    required
                  />
                  <p className={tm.fieldHint}><Info size={12} /> Share this password with the teacher securely</p>
                </div>
                <div className={tm.actions}>
                  <Button type="button" variant="secondary" onClick={() => setShowTeacherModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={teacherLoading} disabled={teacherLoading}>
                    {teacherLoading ? 'Creating...' : <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Create Teacher</>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard