import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Megaphone, 
  FileText, 
  ClipboardList,
  Settings,
  User
} from 'lucide-react'
import styles from './Sidebar.module.css'

const Sidebar = ({ userRole = 'student' }) => {
  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
          { icon: Users, label: 'Users', href: '/users' },
          { icon: BookOpen, label: 'Classes', href: '/classes' },
          { icon: FileText, label: 'Reports', href: '/reports' },
          { icon: Settings, label: 'Settings', href: '/settings' }
        ]
      case 'teacher':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
          { icon: BookOpen, label: 'Classes', href: '/classes' },
          { icon: Megaphone, label: 'Announcements', href: '/announcements' },
          { icon: FileText, label: 'Materials', href: '/materials' },
          { icon: ClipboardList, label: 'Quizzes', href: '/quizzes' },
          { icon: Users, label: 'Students', href: '/students' }
        ]
      case 'student':
      default:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
          { icon: BookOpen, label: 'My Classes', href: '/classes' },
          { icon: Megaphone, label: 'Announcements', href: '/announcements' },
          { icon: FileText, label: 'Materials', href: '/materials' }
        ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.logo}>TutorSpace</h2>
        <p className={styles.roleLabel}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
      </div>
      
      <nav className={styles.navigation}>
        {navigationItems.map((item, index) => (
          <a 
            key={index}
            href={item.href} 
            className={`${styles.navItem} ${index === 0 ? styles.navItemActive : ''}`}
          >
            <item.icon size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{item.label}</span>
          </a>
        ))}
      </nav>
      
      <div className={styles.sidebarFooter}>
        <a href="/profile" className={styles.navItem}>
          <User size={20} className={styles.navIcon} />
          <span className={styles.navLabel}>Profile</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar
