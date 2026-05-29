import React, { useState, useEffect } from 'react'
import { RefreshCw, PlusCircle, AlertCircle, CheckCircle, XCircle, Ban, Trash2, Target, Info } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import Input from '../../../components/shared/Input'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { userAPI } from '../../../services/api'
import { SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import styles from './AdminUsers.module.css'

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
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', userId: null, userName: '' })

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let result = [...users]
    if (searchTerm) result = result.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    if (filterRole !== 'all') result = result.filter(u => u.role.name === filterRole)
    if (filterStatus !== 'all') result = result.filter(u => u.status === filterStatus)
    result = result.filter(u => u.role.name !== 'admin')
    setFilteredUsers(result)
  }, [users, searchTerm, filterRole, filterStatus])

  const fetchUsers = async () => {
    try { setLoading(true); const res = await userAPI.getAllUsers(); setUsers(res.data.data.users) }
    catch (err) { setError('Failed to load users') }
    finally { setLoading(false) }
  }

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId)
      await userAPI.updateUser(userId, { status: 'active' })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
      toast.success('User approved successfully')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve user') }
    finally { setActionLoading(null) }
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
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'inactive' } : u))
        toast.success('User deactivated')
      } else {
        await userAPI.deleteUser(userId)
        setUsers(prev => prev.filter(u => u.id !== userId))
        toast.success('User deleted successfully')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setActionLoading(null); setConfirmModal({ open: false, type: '', userId: null, userName: '' }) }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) { case 'admin': return 'primary'; case 'teacher': return 'warning'; case 'student': return 'success'; default: return 'default' }
  }
  const getStatusBadgeColor = (status) => {
    switch (status) { case 'active': return 'success'; case 'pending': return 'warning'; case 'inactive': return 'danger'; default: return 'default' }
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  const handleCreateTeacher = async (e) => {
    e.preventDefault()
    if (!teacherForm.name || !teacherForm.email || !teacherForm.password) { toast.error('All fields are required'); return }
    if (teacherForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setTeacherLoading(true)
    try {
      await userAPI.createTeacher(teacherForm)
      toast.success('Teacher created successfully!')
      setShowTeacherModal(false)
      setTeacherForm({ name: '', email: '', password: '' })
      fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create teacher') }
    finally { setTeacherLoading(false) }
  }

  const getConfirmTitle = () => confirmModal.type === 'delete' ? 'Delete User' : 'Deactivate User'
  const getConfirmMessage = () => confirmModal.type === 'delete'
    ? `Delete "${confirmModal.userName}"? This permanently removes the user and all their data.`
    : `Deactivate "${confirmModal.userName}"? They will no longer be able to log in.`

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.usersPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>User Management</h1>
            <p className={styles.pageSubtitle}>{users.length} total users{pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount} pending approval</span>}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={fetchUsers}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
            <Button variant="primary" onClick={() => setShowTeacherModal(true)}><PlusCircle size={16} style={{ marginRight: '6px' }} /> Create Teacher</Button>
          </div>
        </div>

        <div className={styles.filtersBar}>
          <div className={styles.searchWrapper}><Input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className={styles.filterButtons}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Role:</span>
              {['all', 'teacher', 'student'].map(role => (
                <button key={role} className={`${styles.filterBtn} ${filterRole === role ? styles.filterBtnActive : ''}`} onClick={() => setFilterRole(role)} aria-pressed={filterRole === role}>{role.charAt(0).toUpperCase() + role.slice(1)}</button>
              ))}
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Status:</span>
              {['all', 'active', 'pending', 'inactive'].map(status => (
                <button key={status} className={`${styles.filterBtn} ${filterStatus === status ? styles.filterBtnActive : ''}`} onClick={() => setFilterStatus(status)} aria-pressed={filterStatus === status}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className={styles.errorState} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <>
            <p className={styles.resultsCount}>Showing {filteredUsers.length} of {users.length} users</p>
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Data table">
                <thead><tr><th className={styles.th}>User</th><th className={styles.th}>Role</th><th className={styles.th}>Status</th><th className={styles.th}>Email Verified</th><th className={styles.th}>Joined</th><th className={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className={styles.emptyRow}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '8px' }}>
                        <span style={{ fontSize: '40px' }}>📭</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-ink)', fontWeight: 'bold' }}>{searchTerm || filterRole !== 'all' || filterStatus !== 'all' ? 'No users match your filters' : 'No users registered yet'}</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-muted)' }}>{searchTerm || filterRole !== 'all' || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Users will appear here once they register'}</span>
                      </div>
                    </td></tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className={styles.tr}>
                        <td className={styles.td}><div className={styles.userCell}><div className={styles.avatar}>{user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div><div><p className={styles.userName}>{user.name}</p><p className={styles.userEmail}>{user.email}</p></div></div></td>
                        <td className={styles.td}><span className={`${styles.badge} ${styles[`badge-${getRoleBadgeColor(user.role.name)}`]}`}>{user.role.name}</span></td>
                        <td className={styles.td}><span className={`${styles.badge} ${styles[`badge-${getStatusBadgeColor(user.status)}`]}`}>{user.status}</span></td>
                        <td className={styles.td}><span className={user.emailVerified ? styles.verifiedYes : styles.verifiedNo}>{user.emailVerified ? <CheckCircle size={14} color="var(--color-success)" /> : <XCircle size={14} color="var(--color-muted)" />}</span></td>
                        <td className={styles.td}><span className={styles.dateText}>{new Date(user.createdAt).toLocaleDateString()}</span></td>
                        <td className={styles.td}>
                          <div className={styles.actions}>
                            {user.status === 'pending' && (
                              <button className={styles.approveBtn} onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id}>
                                {actionLoading === user.id ? '...' : <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Approve</>}
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button className={styles.deactivateBtn} onClick={() => promptDeactivate(user.id, user.name)} disabled={actionLoading === user.id}>
                                {actionLoading === user.id ? '...' : <><Ban size={14} style={{ marginRight: '4px' }} /> Deactivate</>}
                              </button>
                            )}
                            {user.status === 'inactive' && (
                              <button className={styles.approveBtn} onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id}>
                                {actionLoading === user.id ? '...' : <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Activate</>}
                              </button>
                            )}
                            <button className={styles.deleteBtn} onClick={() => promptDelete(user.id, user.name)} disabled={actionLoading === user.id}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showTeacherModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }} onClick={() => setShowTeacherModal(false)} onKeyDown={(e) => { if (e.key === "Escape") setShowTeacherModal(false) }} role="dialog" aria-modal="true" aria-label="Create new teacher">
            <div style={{ background: "var(--color-surface-card)", borderRadius: "12px", padding: "32px", maxWidth: "480px", width: "100%", boxShadow: "var(--shadow-lg)" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0", color: "var(--color-ink)", display: "flex", alignItems: "center" }}>
                <Target size={20} style={{ marginRight: '8px' }} /> Create New Teacher
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-muted)", margin: "0 0 24px 0" }}>Set up a teacher account. They will use these credentials to login.</p>
              <form onSubmit={handleCreateTeacher} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-ink)" }}>Full Name</label><input type="text" value={teacherForm.name} aria-label="Teacher full name" onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} placeholder="Jane Doe" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "14px", background: "var(--color-canvas)", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-ink)" }}>Email</label><input type="email" value={teacherForm.email} aria-label="Teacher email address" onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="jane@school.com" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "14px", background: "var(--color-canvas)", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-ink)" }}>Password (min 6 chars)</label><input type="password" value={teacherForm.password} aria-label="Teacher password" onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Type a secure password" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontFamily: "var(--font-body)", fontSize: "14px", background: "var(--color-canvas)", boxSizing: "border-box" }} />
                  <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: "6px 0 0 0", display: "flex", alignItems: "center", gap: "4px" }}><Info size={12} /> Share this password with the teacher securely</p>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px", justifyContent: "flex-end" }}>
                  <Button type="button" variant="secondary" onClick={() => setShowTeacherModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={teacherLoading} disabled={teacherLoading}>
                    {teacherLoading ? 'Creating...' : <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Create Teacher</>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, type: '', userId: null, userName: '' })} onConfirm={handleConfirmAction} title={getConfirmTitle()} message={getConfirmMessage()} confirmLabel={confirmModal.type === 'delete' ? 'Delete User' : 'Deactivate User'} confirmVariant={confirmModal.type === 'delete' ? 'danger' : 'warning'} loading={!!actionLoading} />
      </div>
    </DashboardLayout>
  )
}

export default AdminUsers