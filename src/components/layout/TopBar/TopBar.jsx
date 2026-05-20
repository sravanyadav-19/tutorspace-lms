import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import styles from './TopBar.module.css'

const TopBar = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return { icon: '👑', label: 'Admin' }
      case 'teacher': return { icon: '🎯', label: 'Teacher' }
      case 'student': return { icon: '🎓', label: 'Student' }
      default: return { icon: '👤', label: 'User' }
    }
  }

  const getAvatarClass = (role) => {
    switch (role) {
      case 'admin': return styles.adminAvatar
      case 'teacher': return styles.teacherAvatar
      case 'student': return styles.studentAvatar
      default: return ''
    }
  }

  const roleBadge = getRoleBadge(user?.role)

  const handleSettings = () => {
    setDropdownOpen(false)
    navigate('/settings')
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
  }

  return (
    <header className={styles.topBar}>
      {/* Left: Menu Button */}
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <Menu size={22} />
        </button>
      </div>

      {/* Right: User Profile */}
      <div className={styles.right}>
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button
            className={styles.profileBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className={`${styles.avatar} ${getAvatarClass(user?.role)}`}>
              <span className={styles.avatarInitials}>
                {getInitials(user?.name)}
              </span>
              <span className={styles.roleBadge}>{roleBadge.icon}</span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRole}>{roleBadge.label}</span>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{user?.name}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleSettings}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
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
