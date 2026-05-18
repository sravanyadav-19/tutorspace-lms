import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './Sidebar.module.css'

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { icon: '📊', label: 'Dashboard', path: '/admin/dashboard', description: 'Overview & stats' },
          { icon: '👥', label: 'Users', path: '/admin/users', description: 'Manage users' },
          { icon: '📚', label: 'Classes', path: '/admin/classes', description: 'Manage classes' },
          { icon: '➕', label: 'Create Class', path: '/admin/classes/new', description: 'Add new class' }
        ]
      case 'teacher':
        return [
          { icon: '📊', label: 'Dashboard', path: '/teacher/dashboard', description: 'Your overview' },
          { icon: '📚', label: 'My Classes', path: '/teacher/classes', description: 'Your classes' },
          { icon: '📄', label: 'Files', path: '/teacher/files', description: 'Upload files' },
          { icon: '📝', label: 'Quizzes', path: '/teacher/quizzes', description: 'Create quizzes' },
          { icon: '📈', label: 'Analytics', path: '/teacher/analytics', description: 'View results' }
        ]
      case 'student':
        return [
          { icon: '📊', label: 'Dashboard', path: '/student/dashboard', description: 'Your overview' },
          { icon: '📚', label: 'My Classes', path: '/student/classes', description: 'Enrolled classes' },
          { icon: '📢', label: 'Announcements', path: '/student/announcements', description: 'Latest updates' },
          { icon: '📄', label: 'Files', path: '/student/files', description: 'View files' },
          { icon: '📝', label: 'Quizzes', path: '/student/quizzes', description: 'Take quizzes' },
          { icon: '🏆', label: 'Results', path: '/student/results', description: 'View grades' }
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const isActivePath = (path) => {
    return location.pathname === path ||
      location.pathname.startsWith(path + '/')
  }

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

      {/* Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo} onClick={() => navigate('/dashboard')}>
          <span className={styles.logoIcon}>🎓</span>
          {!isCollapsed && (
            <span className={styles.logoText}>TutorSpace</span>
          )}
        </div>
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '☰' : '✕'}
        </button>
      </div>

      {/* User Info */}
      <div className={styles.userInfo}>
        <div className={styles.userAvatar}>
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
        </div>
        {!isCollapsed && (
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.role}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.path} className={styles.navItem}>
              <button
                className={`
                  ${styles.navLink}
                  ${isActivePath(item.path) ? styles.navLinkActive : ''}
                `}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : ''}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!isCollapsed && (
                  <div className={styles.navContent}>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navDescription}>{item.description}</span>
                  </div>
                )}
                {isActivePath(item.path) && (
                  <span className={styles.activeIndicator} />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        {!isCollapsed && (
          <>
            <p className={styles.footerText}>Day 9/50 • Results System</p>
            <button className={styles.logoutBtn} onClick={logout}>
              🚪 Logout
            </button>
          </>
        )}
        {isCollapsed && (
          <button
            className={styles.logoutBtnCollapsed}
            onClick={logout}
            title="Logout"
          >
            🚪
          </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar
