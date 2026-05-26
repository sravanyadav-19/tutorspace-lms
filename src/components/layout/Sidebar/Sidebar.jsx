import React, { useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, PlusCircle,
  Megaphone, FileText, ClipboardList, BarChart3,
  Trophy, X
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import styles from './Sidebar.module.css'

const Sidebar = ({ isOpen, onClose, isMobile, isCollapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const navListRef = useRef(null)

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { Icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', description: 'Overview & stats' },
          { Icon: Users, label: 'Users', path: '/admin/users', description: 'Manage users' },
          { Icon: BookOpen, label: 'Classes', path: '/admin/classes', description: 'Manage classes' },
          { Icon: PlusCircle, label: 'Create Class', path: '/admin/classes/new', description: 'Add new class' }
        ]
      case 'teacher':
        return [
          { Icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard', description: 'Your overview' },
          { Icon: BookOpen, label: 'My Classes', path: '/teacher/classes', description: 'Your classes' },
          { Icon: FileText, label: 'Files', path: '/teacher/files', description: 'Upload files' },
          { Icon: ClipboardList, label: 'Quizzes', path: '/teacher/quizzes', description: 'Create quizzes' },
          { Icon: BarChart3, label: 'Analytics', path: '/teacher/analytics', description: 'View results' }
        ]
      case 'student':
        return [
          { Icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard', description: 'Your overview' },
          { Icon: BookOpen, label: 'My Classes', path: '/student/classes', description: 'Enrolled classes' },
          { Icon: Megaphone, label: 'Announcements', path: '/student/announcements', description: 'Latest updates' },
          { Icon: FileText, label: 'Files', path: '/student/files', description: 'View files' },
          { Icon: ClipboardList, label: 'Quizzes', path: '/student/quizzes', description: 'Take quizzes' },
          { Icon: Trophy, label: 'Results', path: '/student/results', description: 'View grades' }
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) onClose()
  }

  const handleKeyDown = useCallback((e) => {
    const current = document.activeElement
    const items = navListRef.current?.querySelectorAll('button') || []
    const currentIndex = Array.from(items).indexOf(current)

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus()
        } else {
          items[0]?.focus()
        }
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        if (currentIndex > 0) {
          items[currentIndex - 1].focus()
        } else {
          items[items.length - 1]?.focus()
        }
        break
      case 'Home':
        e.preventDefault()
        items[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        items[items.length - 1]?.focus()
        break
      case 'Escape':
        if (isMobile && isOpen) {
          e.preventDefault()
          onClose()
        }
        break
      default:
        break
    }
  }, [isMobile, isOpen, onClose])

  return (
    <>
      {isMobile && isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          role="presentation"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          ${styles.sidebar}
          ${isMobile ? styles.mobileSidebar : ''}
          ${isMobile && isOpen ? styles.mobileOpen : ''}
          ${!isMobile && isCollapsed ? styles.collapsed : ''}
        `}
        aria-label="Main navigation"
        role="complementary"
      >
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div
            className={styles.logo}
            onClick={() => navigate('/dashboard')}
            role="button"
            tabIndex={0}
            aria-label="TutorSpace home"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/dashboard') } }}
          >
            <span className={styles.logoIcon} aria-hidden="true">🎓</span>
            {!isCollapsed && (
              <span className={styles.logoText}>TutorSpace</span>
            )}
          </div>
          {isMobile && (
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={styles.nav}
          aria-label={`${user?.role || 'User'} navigation`}
        >
          <ul
            className={styles.navList}
            ref={navListRef}
            role="list"
          >
            {menuItems.map((item) => {
              const Icon = item.Icon
              const active = isActivePath(item.path)
              return (
                <li key={item.path} className={styles.navItem} role="none">
                  <button
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    onKeyDown={handleKeyDown}
                    title={isCollapsed ? item.label : ''}
                    aria-current={active ? 'page' : undefined}
                    aria-label={isCollapsed ? item.label : undefined}
                    role="menuitem"
                  >
                    <span className={styles.navIcon} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    {!isCollapsed && (
                      <div className={styles.navContent}>
                        <span className={styles.navLabel}>{item.label}</span>
                        <span className={styles.navDescription}>{item.description}</span>
                      </div>
                    )}
                    {active && !isCollapsed && <span className={styles.activeIndicator} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar