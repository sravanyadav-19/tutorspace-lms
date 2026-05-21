import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import Input from '../../../components/shared/Input'
import { userAPI } from '../../../services/api'
import { SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import styles from './AdminUsers.module.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users when search/filter changes
  useEffect(() => {
    let result = [...users]

    // Search filter
    if (searchTerm) {
      result = result.filter(u =>
        u.name.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      result = result.filter(
        u => u.role.name === filterRole
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(
        u => u.status === filterStatus
      )
    }

    setFilteredUsers(result)
  }, [users, searchTerm, filterRole, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userAPI.getAllUsers()
      setUsers(res.data.data.users)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Approve user (change status to active)
  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId)
      await userAPI.updateUser(userId, { 
        status: 'active' 
      })
      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, status: 'active' }
          : u
      ))
    } catch (err) {
      alert('Failed to approve user')
    } finally {
      setActionLoading(null)
    }
  }

  // Deactivate user
  const handleDeactivate = async (userId) => {
    if (!window.confirm(
      'Are you sure you want to deactivate this user?'
    )) return

    try {
      setActionLoading(userId)
      await userAPI.updateUser(userId, { 
        status: 'inactive' 
      })
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, status: 'inactive' }
          : u
      ))
    } catch (err) {
      alert('Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  // Delete user
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(
      `Delete ${userName}? This cannot be undone.`
    )) return

    try {
      setActionLoading(userId)
      await userAPI.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert('Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'primary'
      case 'teacher': return 'warning'
      case 'student': return 'success'
      default: return 'default'
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'pending': return 'warning'
      case 'inactive': return 'danger'
      default: return 'default'
    }
  }

  const pendingCount = users.filter(
    u => u.status === 'pending'
  ).length

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.usersPage}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              User Management
            </h1>
            <p className={styles.pageSubtitle}>
              {users.length} total users
              {pendingCount > 0 && (
                <span className={styles.pendingBadge}>
                  {pendingCount} pending approval
                </span>
              )}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchUsers}
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrapper}>
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterButtons}>
            {/* Role Filter */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Role:</span>
              {['all', 'admin', 'teacher', 'student'].map(
                role => (
                  <button
                    key={role}
                    className={`
                      ${styles.filterBtn}
                      ${filterRole === role 
                        ? styles.filterBtnActive 
                        : ''}
                    `}
                    onClick={() => setFilterRole(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Status Filter */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>
                Status:
              </span>
              {['all', 'active', 'pending', 'inactive'].map(
                status => (
                  <button
                    key={status}
                    className={`
                      ${styles.filterBtn}
                      ${filterStatus === status
                        ? styles.filterBtnActive
                        : ''}
                    `}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + 
                      status.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorState}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Results Count */}
            <p className={styles.resultsCount}>
              Showing {filteredUsers.length} of {users.length} users
            </p>

            {/* Users Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>User</th>
                    <th className={styles.th}>Role</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>
                      Email Verified
                    </th>
                    <th className={styles.th}>Joined</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className={styles.emptyRow}
                      >
                        No users found matching filters
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr
                        key={user.id}
                        className={styles.tr}
                      >
                        {/* User Info */}
                        <td className={styles.td}>
                          <div className={styles.userCell}>
                            <div className={styles.avatar}>
                              {user.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className={styles.userName}>
                                {user.name}
                              </p>
                              <p className={styles.userEmail}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className={styles.td}>
                          <span className={`
                            ${styles.badge}
                            ${styles[`badge-${
                              getRoleBadgeColor(user.role.name)
                            }`]}
                          `}>
                            {user.role.name}
                          </span>
                        </td>

                        {/* Status */}
                        <td className={styles.td}>
                          <span className={`
                            ${styles.badge}
                            ${styles[`badge-${
                              getStatusBadgeColor(user.status)
                            }`]}
                          `}>
                            {user.status}
                          </span>
                        </td>

                        {/* Email Verified */}
                        <td className={styles.td}>
                          <span className={
                            user.emailVerified
                              ? styles.verifiedYes
                              : styles.verifiedNo
                          }>
                            {user.emailVerified ? '✅' : '❌'}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className={styles.td}>
                          <span className={styles.dateText}>
                            {new Date(user.createdAt)
                              .toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={styles.td}>
                          <div className={styles.actions}>
                            {user.status === 'pending' && (
                              <button
                                className={styles.approveBtn}
                                onClick={() => 
                                  handleApprove(user.id)
                                }
                                disabled={
                                  actionLoading === user.id
                                }
                              >
                                {actionLoading === user.id
                                  ? '...'
                                  : '✅ Approve'
                                }
                              </button>
                            )}

                            {user.status === 'active' && (
                              <button
                                className={styles.deactivateBtn}
                                onClick={() =>
                                  handleDeactivate(user.id)
                                }
                                disabled={
                                  actionLoading === user.id
                                }
                              >
                                {actionLoading === user.id
                                  ? '...'
                                  : '🚫 Deactivate'
                                }
                              </button>
                            )}

                            {user.status === 'inactive' && (
                              <button
                                className={styles.approveBtn}
                                onClick={() =>
                                  handleApprove(user.id)
                                }
                                disabled={
                                  actionLoading === user.id
                                }
                              >
                                {actionLoading === user.id
                                  ? '...'
                                  : '✅ Activate'
                                }
                              </button>
                            )}

                            <button
                              className={styles.deleteBtn}
                              onClick={() =>
                                handleDelete(user.id, user.name)
                              }
                              disabled={
                                actionLoading === user.id
                              }
                            >
                              🗑️
                            </button>
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
      </div>
    </DashboardLayout>
  )
}

export default AdminUsers
