import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, ChevronDown, Crown, Target, GraduationCap } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import styles from './TopBar.module.css'

const TopBar = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const profileBtnRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false)
      profileBtnRef.current?.focus()
    }
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin': return { Icon: Crown, label: 'Admin', avatarClass: styles.adminAvatar }
      case 'teacher': return { Icon: Target, label: 'Teacher', avatarClass: styles.teacherAvatar }
      case 'student': return { Icon: GraduationCap, label: 'Student', avatarClass: styles.studentAvatar }
      default: return { Icon: null, label: 'User', avatarClass: '' }
    }
  }

  const roleConfig = getRoleConfig(user?.role)

  const handleSettings = () => {
    setDropdownOpen(false)
    navigate('/settings')
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    logout('logout')
  }

  return (
    <header
      className={styles.topBar}
      role="banner"
      aria-label="Top navigation bar"
    >
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.right}>
        <div className={styles.profileWrapper} ref={dropdownRef} onKeyDown={handleKeyDown}>
          <button
            ref={profileBtnRef}
            className={styles.profileBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label={`User menu for ${user?.name || 'User'}`}
          >
            <div className={`${styles.avatar} ${roleConfig.avatarClass}`} aria-hidden="true">
              <span className={styles.avatarInitials}>
                {getInitials(user?.name)}
              </span>
              <span className={styles.roleBadge}>
                {roleConfig.Icon && <roleConfig.Icon size={10} />}
              </span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRole}>{roleConfig.label}</span>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div
              className={styles.dropdown}
              role="menu"
              aria-label="User actions"
            >
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{user?.name}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <div className={styles.dropdownDivider} aria-hidden="true" />
              <button
                className={styles.dropdownItem}
                onClick={handleSettings}
                role="menuitem"
              >
                <Settings size={16} aria-hidden="true" />
                <span>Settings</span>
              </button>
              <div className={styles.dropdownDivider} aria-hidden="true" />
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
                role="menuitem"
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar