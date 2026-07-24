import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Lock,
  Save,
  Crown,
  Target,
  GraduationCap,
  ArrowLeft,
  Shield,
  Clock,
  LogOut,
  Info
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'
import PasswordStrength from '../../components/shared/PasswordStrength/PasswordStrength'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userAPI } from '../../services/api'
import { validateField } from '../../utils/validation'
import { SESSION_IDLE_MS, SESSION_WARNING_MS } from '../../utils/session'
import styles from './Settings.module.css'

const ROLE_META = {
  admin: { Icon: Crown, color: '#7c3aed', label: 'Admin' },
  teacher: { Icon: Target, color: '#cc785c', label: 'Teacher' },
  student: { Icon: GraduationCap, color: '#1565c0', label: 'Student' }
}
const DEFAULT_ROLE_META = { Icon: User, color: '#3d3d3a', label: 'User' }

const formatRole = (role) => ROLE_META[role]?.label || DEFAULT_ROLE_META.label

const idleMinutes = Math.round(SESSION_IDLE_MS / 60000)
const warningSeconds = Math.round(SESSION_WARNING_MS / 1000)

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, login, logout } = useAuth()
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

  const profileDirty = useMemo(() => {
    if (!user) return false
    return (
      name.trim() !== (user.name || '').trim() ||
      email.trim().toLowerCase() !== (user.email || '').trim().toLowerCase()
    )
  }, [user, name, email])

  const getInitials = (value) => {
    if (!value) return 'U'
    return value.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarClass = (role) => {
    switch (role) {
      case 'admin': return styles.adminAvatar
      case 'teacher': return styles.teacherAvatar
      case 'student': return styles.studentAvatar
      default: return ''
    }
  }

  const roleMeta = ROLE_META[user?.role] || DEFAULT_ROLE_META
  const RoleBadgeIcon = roleMeta.Icon

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileTouched({ name: true, email: true })
    if (!profileValid || !profileDirty) return
    setLoading(true)
    try {
      const res = await userAPI.updateUser(user.id, {
        name: name.trim(),
        email: email.trim().toLowerCase()
      })
      const updatedUser = res.data.data.user
      const token = localStorage.getItem('tutorspace_token')
      login({ ...user, name: updatedUser.name, email: updatedUser.email }, token)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to update profile'
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
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to update password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    logout('logout')
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className={styles.settingsPage}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>
              Update your profile and password
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className={styles.backBtn}
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Mobile horizontal tabs */}
        <div className={styles.tabsHorizontal} role="tablist" aria-label="Settings sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`${styles.hTab} ${activeTab === 'profile' ? styles.hTabActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} aria-hidden="true" />
            Profile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            className={`${styles.hTab} ${activeTab === 'password' ? styles.hTabActive : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={15} aria-hidden="true" />
            Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            className={`${styles.hTab} ${activeTab === 'security' ? styles.hTabActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={15} aria-hidden="true" />
            Security
          </button>
        </div>

        <div className={styles.contentLayout}>
          {/* Left profile summary */}
          <aside className={styles.profileSummary}>
            <div className={styles.profileTop}>
              <div className={`${styles.bigAvatar} ${getAvatarClass(user?.role)}`}>
                <span className={styles.bigInitials}>{getInitials(user?.name)}</span>
                <span className={styles.bigRoleBadge} aria-hidden="true">
                  <RoleBadgeIcon size={14} style={{ color: roleMeta.color }} />
                </span>
              </div>
              <div className={styles.profileTextBlock}>
                <h2 className={styles.profileName}>{user?.name}</h2>
                <p className={styles.profileEmail} title={user?.email}>{user?.email}</p>
                <span
                  className={`${styles.profileRole} ${styles[`rolePill-${user?.role}`] || ''}`}
                >
                  {formatRole(user?.role)}
                </span>
              </div>
            </div>

            <div className={styles.tabsVertical} role="tablist" aria-label="Settings sections">
              <p className={styles.navSectionLabel}>Account</p>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'profile'}
                className={`${styles.vTab} ${activeTab === 'profile' ? styles.vTabActive : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={15} aria-hidden="true" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'password'}
                className={`${styles.vTab} ${activeTab === 'password' ? styles.vTabActive : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <Lock size={15} aria-hidden="true" />
                <span>Password</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'security'}
                className={`${styles.vTab} ${activeTab === 'security' ? styles.vTabActive : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={15} aria-hidden="true" />
                <span>Security</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className={styles.mainContent}>
            {activeTab === 'profile' && (
              <div className={styles.formCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Personal details</h3>
                  <p className={styles.cardSubtitle}>
                    This information appears across your TutorSpace account.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className={styles.form} noValidate>
                  <Input
                    label="Full name"
                    name="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setProfileTouched((p) => ({ ...p, name: true }))}
                    error={profileTouched.name ? profileErrors.name : ''}
                    required
                    disabled={loading}
                    autoComplete="name"
                  />
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    placeholder="you@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setProfileTouched((p) => ({ ...p, email: true }))}
                    error={profileTouched.email ? profileErrors.email : ''}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />

                  <div className={styles.roleBlock}>
                    <span className={styles.formLabel}>Role</span>
                    <div className={styles.roleChipRow}>
                      <span
                        className={`${styles.roleChip} ${styles[`roleChip-${user?.role}`] || ''}`}
                      >
                        <RoleBadgeIcon size={14} aria-hidden="true" />
                        {formatRole(user?.role)}
                      </span>
                    </div>
                    <p className={styles.formHint}>
                      <Info size={12} aria-hidden="true" />
                      Only an administrator can change your role.
                    </p>
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading || !profileValid || !profileDirty}
                    >
                      {loading ? (
                        'Saving…'
                      ) : (
                        <>
                          <Save size={16} aria-hidden="true" />
                          <span>Save changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className={styles.formCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Security</h3>
                  <p className={styles.cardSubtitle}>
                    Choose a strong password you don&apos;t use elsewhere.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className={styles.form} noValidate>
                  <div className={styles.passwordTips}>
                    <p className={styles.tipsTitle}>
                      <Lock size={15} aria-hidden="true" />
                      <span>Password tips</span>
                    </p>
                    <ul className={styles.tipsList}>
                      <li>Use at least 6 characters</li>
                      <li>Mix letters and numbers</li>
                      <li>Avoid common words or names</li>
                    </ul>
                  </div>

                  <Input
                    label="Current password"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => setPasswordTouched((p) => ({ ...p, currentPassword: true }))}
                    error={passwordTouched.currentPassword ? passwordErrors.currentPassword : ''}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Input
                    label="New password"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    helperText="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => setPasswordTouched((p) => ({ ...p, newPassword: true }))}
                    error={passwordTouched.newPassword ? passwordErrors.newPassword : ''}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={newPassword} />
                  <Input
                    label="Confirm new password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setPasswordTouched((p) => ({ ...p, confirmPassword: true }))}
                    error={passwordTouched.confirmPassword ? passwordErrors.confirmPassword : ''}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading || !passwordValid}
                    >
                      {loading ? (
                        'Updating…'
                      ) : (
                        <>
                          <Lock size={16} aria-hidden="true" />
                          <span>Update password</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={styles.formCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Session & security</h3>
                  <p className={styles.cardSubtitle}>
                    How TutorSpace keeps your account safe on shared devices.
                  </p>
                </div>

                <div className={styles.sessionPanel}>
                  <div className={styles.sessionIcon} aria-hidden="true">
                    <Clock size={22} />
                  </div>
                  <div className={styles.sessionBody}>
                    <h4 className={styles.sessionTitle}>Automatic sign-out</h4>
                    <p className={styles.sessionText}>
                      You&apos;ll be signed out after <strong>{idleMinutes} minutes</strong> of
                      inactivity. A warning appears about{' '}
                      <strong>{warningSeconds} seconds</strong> before logout so you can stay
                      signed in.
                    </p>
                    <ul className={styles.sessionList}>
                      <li>Applies to admin, teacher, and student accounts</li>
                      <li>Activity in any TutorSpace tab keeps the session alive</li>
                      <li>Using other websites does not count as activity</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.dangerZone}>
                  <div>
                    <h4 className={styles.dangerTitle}>Sign out</h4>
                    <p className={styles.dangerText}>
                      End your session on this device. You&apos;ll need your password to sign in
                      again.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleSignOut}>
                    <LogOut size={16} aria-hidden="true" />
                    <span>Sign out</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
