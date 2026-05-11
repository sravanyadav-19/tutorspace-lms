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

# Update App.jsx to show dashboard layout
cat > src/App.jsx << 'EOF'
import React, { useState } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import Button from './components/shared/Button'
import Input, { Textarea } from './components/shared/Input'
import './App.css'

function App() {
  const [userRole, setUserRole] = useState('student')

  return (
    <DashboardLayout userRole={userRole}>
      <div className="dashboard-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to your TutorSpace dashboard</p>
        </div>
        
        <div className="demo-section">
          <h2 className="section-title">Role Demo</h2>
          <p className="section-description">Switch between user roles to see different navigation:</p>
          
          <div className="role-switcher">
            <Button 
              variant={userRole === 'student' ? 'primary' : 'secondary'}
              onClick={() => setUserRole('student')}
            >
              Student View
            </Button>
            <Button 
              variant={userRole === 'teacher' ? 'primary' : 'secondary'}
              onClick={() => setUserRole('teacher')}
            >
              Teacher View
            </Button>
            <Button 
              variant={userRole === 'admin' ? 'primary' : 'secondary'}
              onClick={() => setUserRole('admin')}
            >
              Admin View
            </Button>
          </div>
          
          <div className="status-display">
            <div className="status-card">
              <h3 className="card-title">Current Role</h3>
              <p className="card-value">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
            </div>
            <div className="status-card">
              <h3 className="card-title">Day Progress</h3>
              <p className="card-value">2/50</p>
            </div>
            <div className="status-card">
              <h3 className="card-title">Components</h3>
              <p className="card-value">Layout Ready</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default App
