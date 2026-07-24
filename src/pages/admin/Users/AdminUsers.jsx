import React, { useState, useEffect } from 'react'
import { RefreshCw, UserPlus, AlertCircle, CheckCircle, Ban, Trash2, Target, Info, Search, Users, GraduationCap, Clock } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { userAPI } from '../../../services/api'
import { SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import styles from './AdminUsers.module.css'
import tm from './TeacherModal.module.css'

const AdminUsers = () => {
  const toast = useToast()
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' })
  const [teacherLoading, setTeacherLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'teacher' | 'student' | 'pending'
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', userId: null, userName: '' })

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let result = [...(users || [])]

    // Filter out Admins from user management table
    result = result.filter(u => u.role?.name !== 'admin')

    // Tab filtering
    if (activeTab === 'teacher') {
      result = result.filter(u => u.role?.name === 'teacher')
    } else if (activeTab === 'student') {
      result = result.filter(u => u.role?.name === 'student')
    } else if (activeTab === 'pending') {
      result = result.filter(u => u.status === 'pending')
    }

    // Status dropdown filtering (only applies if not in 'pending' tab)
    if (activeTab !== 'pending' && statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter)
    }

    // Search query filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(result)
  }, [users, searchTerm, activeTab, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userAPI.getAllUsers()
      setUsers(res?.data?.data?.users || [])
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId)
      const res = await userAPI.updateUser(userId, { status: 'active' })
      const updated = res?.data?.data?.user
      // Prefer server response so UI matches DB (status + emailVerified)
      setUsers(prev => (prev || []).map(u => {
        if (u.id !== userId) return u
        return {
          ...u,
          status: updated?.status || 'active',
          emailVerified: updated?.emailVerified ?? true,
          email: updated?.email || u.email,
          name: updated?.name || u.name
        }
      }))
      toast.success(res?.data?.message || 'User approved successfully!')
    } catch (err) {
      // Do not optimistically flip status if the API failed
      toast.error(err.response?.data?.message || 'Failed to approve user')
      // Re-sync list so a partial failure can't leave a fake "active" badge
      fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const promptDeactivate = (userId, userName) => setConfirmModal({ open: true, type: 'deactivate', userId, userName })
  const promptDelete = (userId, userName) => setConfirmModal({ open: true, type: 'delete', userId, userName })

  const handleConfirmAction = async () => {
    const { type, userId } = confirmModal
    if (!userId) return
    setActionLoading(userId)
    try {
      if (type === 'deactivate') {
        await userAPI.updateUser(userId, { status: 'inactive' })
        setUsers(prev => (prev || []).map(u => u.id === userId ? { ...u, status: 'inactive' } : u))
        toast.success('User account deactivated')
      } else {
        await userAPI.deleteUser(userId)
        setUsers(prev => (prev || []).filter(u => u.id !== userId))
        toast.success('User deleted successfully')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
      setConfirmModal({ open: false, type: '', userId: null, userName: '' })
    }
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
      toast.success('Teacher created successfully!')
      setShowTeacherModal(false)
      setTeacherForm({ name: '', email: '', password: '' })
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher')
    } finally {
      setTeacherLoading(false)
    }
  }

  const pendingCount = (users || []).filter(u => u.status === 'pending').length
  const teacherCount = (users || []).filter(u => u.role?.name === 'teacher').length
  const studentCount = (users || []).filter(u => u.role?.name === 'student').length

  const getConfirmTitle = () => confirmModal.type === 'delete' ? 'Delete User' : 'Deactivate User'
  const getConfirmMessage = () => confirmModal.type === 'delete'
    ? `Permanently delete "${confirmModal.userName}"? All associated data will be removed.`
    : `Deactivate "${confirmModal.userName}"? They will be unable to sign in until re-activated.`

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.usersPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>User Management</h1>
            <p className={styles.pageSubtitle}>Review user accounts, grant access, and create instructor profiles</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchUsers}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowTeacherModal(true)}>
              <UserPlus size={16} style={{ marginRight: '6px' }} /> Create Teacher
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorState} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {/* Primary Segmented Navigation Tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Users size={16} /> All Users ({users.filter(u => u.role?.name !== 'admin').length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'teacher' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('teacher')}
          >
            <Target size={16} /> Teachers ({teacherCount})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'student' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <GraduationCap size={16} /> Students ({studentCount})
          </button>

          <button
            className={`${styles.tabBtn} ${styles.pendingTabBtn} ${activeTab === 'pending' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={16} /> Pending Approvals
            {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount}</span>}
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {activeTab !== 'pending' && (
            <div className={styles.filterDropdownWrapper}>
              <label htmlFor="status-filter" className={styles.filterLabel}>Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.statusSelect}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>Showing {filteredUsers.length} user accounts</p>

            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Users table">
                <thead>
                  <tr>
                    <th className={styles.th}>User Details</th>
                    <th className={styles.th}>Role</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Joined Date</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyRow}>
                        <div className={styles.emptyContainer}>
                          <span style={{ fontSize: '36px' }}>📬</span>
                          <p className={styles.emptyTitle}>No Users Found</p>
                          <p className={styles.emptyText}>No user accounts match your search or selected filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.userCell}>
                            <div className={styles.avatar}>
                              {(user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className={styles.userName}>{user.name}</p>
                              <p className={styles.userEmail}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.badge} ${styles[`role-${user.role?.name}`]}`}>
                            {user.role?.name}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusPill} ${styles[`status-${user.status}`]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.dateText}>
                            {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <div className={styles.actionsGroup}>
                            {user.status === 'pending' && (
                              <button
                                className={styles.approveBtn}
                                onClick={() => handleApprove(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <CheckCircle size={14} style={{ marginRight: '4px' }} />
                                Approve
                              </button>
                            )}

                            {user.status === 'active' && (
                              <button
                                className={styles.deactivateBtn}
                                onClick={() => promptDeactivate(user.id, user.name)}
                                disabled={actionLoading === user.id}
                              >
                                <Ban size={14} style={{ marginRight: '4px' }} />
                                Deactivate
                              </button>
                            )}

                            {user.status === 'inactive' && (
                              <button
                                className={styles.approveBtn}
                                onClick={() => handleApprove(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <CheckCircle size={14} style={{ marginRight: '4px' }} />
                                Activate
                              </button>
                            )}

                            <button
                              className={styles.deleteBtn}
                              onClick={() => promptDelete(user.id, user.name)}
                              disabled={actionLoading === user.id}
                              title="Delete account"
                              aria-label="Delete account"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className={styles.mobileCardsList}>
              {filteredUsers.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <p className={styles.emptyTitle}>No Users Found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className={styles.mobileCard}>
                    <div className={styles.mobileCardTop}>
                      <div className={styles.avatar}>
                        {(user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className={styles.mobileUserInfo}>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                      <span className={`${styles.statusPill} ${styles[`status-${user.status}`]}`}>
                        {user.status}
                      </span>
                    </div>

                    <div className={styles.mobileCardMeta}>
                      <span className={`${styles.badge} ${styles[`role-${user.role?.name}`]}`}>
                        {user.role?.name}
                      </span>
                      <span className={styles.dateText}>
                        Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className={styles.mobileCardActions}>
                      {user.status === 'pending' && (
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Approve
                        </button>
                      )}

                      {user.status === 'active' && (
                        <button
                          className={styles.deactivateBtn}
                          onClick={() => promptDeactivate(user.id, user.name)}
                          disabled={actionLoading === user.id}
                        >
                          <Ban size={14} style={{ marginRight: '4px' }} /> Deactivate
                        </button>
                      )}

                      {user.status === 'inactive' && (
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Activate
                        </button>
                      )}

                      <button
                        className={styles.deleteBtn}
                        onClick={() => promptDelete(user.id, user.name)}
                        disabled={actionLoading === user.id}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Create Teacher Modal */}
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
                  <label className={tm.fieldLabel}>Email Address</label>
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
                  <p className={tm.fieldHint}><Info size={12} /> Share this password securely with the teacher</p>
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

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, type: '', userId: null, userName: '' })}
          onConfirm={handleConfirmAction}
          title={getConfirmTitle()}
          message={getConfirmMessage()}
          confirmLabel={confirmModal.type === 'delete' ? 'Delete User' : 'Deactivate User'}
          confirmVariant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
          loading={!!actionLoading}
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminUsers