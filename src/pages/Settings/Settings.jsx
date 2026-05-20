import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/shared/Button'
import { useAuth } from '../../context/AuthContext'
import { authAPI, userAPI } from '../../services/api'
import styles from './Settings.module.css'

const Settings = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarClass = (role) => {
    switch (role) {
      case 'admin': return styles.adminAvatar
      case 'teacher': return styles.teacherAvatar
      case 'student': return styles.studentAvatar
      default: return ''
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return '👑'
      case 'teacher': return '🎯'
      case 'student': return '🎓'
      default: return '👤'
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Name cannot be empty')
      return
    }
    if (!email.trim()) {
      setError('Email cannot be empty')
      return
    }

    setLoading(true)
    try {
      const res = await userAPI.updateUser(user.id, { name, email })
      const updatedUser = res.data.data.user
      const token = localStorage.getItem('tutorspace_token')
      login(
        { ...user, name: updatedUser.name, email: updatedUser.email },
        token
      )
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }

    setLoading(true)
    try {
      await userAPI.updateUser(user.id, {
        currentPassword,
        newPassword
      })
      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className={styles.settingsPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>⚙️ Settings</h1>
            <p className={styles.pageSubtitle}>
              Manage your account information and security
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
        </div>

        {success && <div className={styles.successBanner}>✅ {success}</div>}
        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        <div className={styles.contentLayout}>

          {/* Left: Profile Summary */}
          <div className={styles.profileSummary}>
            <div className={`${styles.bigAvatar} ${getAvatarClass(user?.role)}`}>
              <span className={styles.bigInitials}>{getInitials(user?.name)}</span>
              <span className={styles.bigRoleBadge}>{getRoleBadge(user?.role)}</span>
            </div>
            <h2 className={styles.profileName}>{user?.name}</h2>
            <p className={styles.profileEmail}>{user?.email}</p>
            <span className={styles.profileRole}>{user?.role}</span>

            {/* Tabs Vertical */}
            <div className={styles.tabsVertical}>
              <button
                className={`${styles.vTab} ${activeTab === 'profile' ? styles.vTabActive : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 Profile Info
              </button>
              <button
                className={`${styles.vTab} ${activeTab === 'password' ? styles.vTabActive : ''}`}
                onClick={() => setActiveTab('password')}
              >
                🔒 Change Password
              </button>
            </div>
          </div>

          {/* Right: Forms */}
          <div className={styles.mainContent}>

            {activeTab === 'profile' && (
              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>👤 Profile Information</h3>

                <form onSubmit={handleUpdateProfile} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Role</label>
                    <input
                      type="text"
                      className={styles.formInputDisabled}
                      value={user?.role || ''}
                      disabled
                    />
                    <p className={styles.formHint}>Role can only be changed by an admin</p>
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? '⏳ Updating...' : '💾 Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>🔒 Change Password</h3>

                <form onSubmit={handleUpdatePassword} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <div className={styles.passwordTips}>
                    <p className={styles.tipsTitle}>🔐 Password Tips:</p>
                    <ul className={styles.tipsList}>
                      <li>At least 6 characters long</li>
                      <li>Mix of letters and numbers recommended</li>
                      <li>Avoid common words or names</li>
                    </ul>
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? '⏳ Updating...' : '🔒 Update Password'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Settings
