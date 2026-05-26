import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'
import PasswordStrength from '../../components/shared/PasswordStrength/PasswordStrength'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userAPI } from '../../services/api'
import { validateField } from '../../utils/validation'
import styles from './Settings.module.css'

const Settings = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileErrors, setProfileErrors] = useState({})
  const [profileTouched, setProfileTouched] = useState({})
  const [profileValid, setProfileValid] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordTouched, setPasswordTouched] = useState({})
  const [passwordValid, setPasswordValid] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    const errors = {}
    let valid = true
    const nameErr = validateField('name', name)
    const emailErr = validateField('email', email)
    if (nameErr) { errors.name = nameErr; valid = false }
    if (emailErr) { errors.email = emailErr; valid = false }
    setProfileErrors(errors)
    setProfileValid(valid)
  }, [name, email])

  useEffect(() => {
    const errors = {}
    let valid = true
    const currentErr = validateField('currentPassword', currentPassword, { newPassword, currentPassword })
    const newErr = validateField('newPassword', newPassword)
    const confirmErr = validateField('confirmPassword', confirmPassword, { password: newPassword })
    if (currentErr) { errors.currentPassword = currentErr; valid = false }
    if (newErr) { errors.newPassword = newErr; valid = false }
    if (confirmErr) { errors.confirmPassword = confirmErr; valid = false }
    if (!currentPassword || !newPassword || !confirmPassword) valid = false
    setPasswordErrors(errors)
    setPasswordValid(valid)
  }, [currentPassword, newPassword, confirmPassword])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
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
      case 'admin': return <PageIcon name='crown' />
      case 'teacher': return <PageIcon name='target' />
      case 'student': return <PageIcon name='graduationCap' />
      default: return <PageIcon name='user' />
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileTouched({ name: true, email: true })
    if (!profileValid) return
    setLoading(true)
    try {
      const res = await userAPI.updateUser(user.id, { name, email })
      const updatedUser = res.data.data.user
      const token = localStorage.getItem('tutorspace_token')
      login({ ...user, name: updatedUser.name, email: updatedUser.email }, token)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordTouched({ currentPassword: true, newPassword: true, confirmPassword: true })
    if (!passwordValid) return
    setLoading(true)
    try {
      await userAPI.updateUser(user.id, { currentPassword, newPassword })
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordTouched({})
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className={styles.settingsPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your account information and security</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}><PageIcon name="back" /> Back to Dashboard/Button>
        </div>
        <div className={styles.contentLayout}>
          <div className={styles.profileSummary}>
            <div className={`${styles.bigAvatar} ${getAvatarClass(user?.role)}`}>
              <span className={styles.bigInitials}>{getInitials(user?.name)}</span>
              <span className={styles.bigRoleBadge}>{getRoleBadge(user?.role)}</span>
            </div>
            <h2 className={styles.profileName}>{user?.name}</h2>
            <p className={styles.profileEmail}>{user?.email}</p>
            <span className={styles.profileRole}>{user?.role}</span>
            <div className={styles.tabsVertical}>
              <button className={`${styles.vTab} ${activeTab === 'profile' ? styles.vTabActive : ''}`} onClick={() => setActiveTab('profile')}>Profile Info</button>
              <button className={`${styles.vTab} ${activeTab === 'password' ? styles.vTabActive : ''}`} onClick={() => setActiveTab('password')}>Change Password</button>
            </div>
          </div>
          <div className={styles.mainContent}>
            {activeTab === 'profile' && (
              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Profile Information</h3>
                <form onSubmit={handleUpdateProfile} className={styles.form} noValidate>
                  <Input label="Full Name" name="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setProfileTouched(p => ({ ...p, name: true }))} error={profileTouched.name ? profileErrors.name : ''} required disabled={loading} />
                  <Input label="Email Address" name="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setProfileTouched(p => ({ ...p, email: true }))} error={profileTouched.email ? profileErrors.email : ''} required disabled={loading} />
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Role</label>
                    <input type="text" className={styles.formInputDisabled} value={user?.role || ''} disabled />
                    <p className={styles.formHint}>Role can only be changed by an admin</p>
                  </div>
                  <div className={styles.formActions}>
                    <Button type="submit" variant="primary" disabled={loading || !profileValid}>{loading ? 'Updating...' : 'Save Changes'}</Button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === 'password' && (
              <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Change Password</h3>
                <form onSubmit={handleUpdatePassword} className={styles.form} noValidate>
                  <Input label="Current Password" name="currentPassword" type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} onBlur={() => setPasswordTouched(p => ({ ...p, currentPassword: true }))} error={passwordTouched.currentPassword ? passwordErrors.currentPassword : ''} required disabled={loading} />
                  <Input label="New Password" name="newPassword" type="password" placeholder="Enter new password (min 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onBlur={() => setPasswordTouched(p => ({ ...p, newPassword: true }))} error={passwordTouched.newPassword ? passwordErrors.newPassword : ''} required disabled={loading} />
                  <PasswordStrength password={newPassword} />
                  <Input label="Confirm New Password" name="confirmPassword" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => setPasswordTouched(p => ({ ...p, confirmPassword: true }))} error={passwordTouched.confirmPassword ? passwordErrors.confirmPassword : ''} required disabled={loading} />
                  <div className={styles.passwordTips}>
                    <p className={styles.tipsTitle}>Password Tips:</p>
                    <ul className={styles.tipsList}>
                      <li>At least 6 characters long</li>
                      <li>Mix of letters and numbers recommended</li>
                      <li>Avoid common words or names</li>
                    </ul>
                  </div>
                  <div className={styles.formActions}>
                    <Button type="submit" variant="primary" disabled={loading || !passwordValid}>{loading ? 'Updating...' : 'Update Password'}</Button>
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
