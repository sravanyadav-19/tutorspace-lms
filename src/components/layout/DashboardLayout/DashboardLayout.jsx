import React, { useState } from 'react'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import styles from './DashboardLayout.module.css'

const DashboardLayout = ({ children, userRole = 'student' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleToggle = () => {
    setIsCollapsed(prev => !prev)
  }

  return (
    <div
      className={`
        ${styles.dashboardLayout}
        ${isCollapsed ? styles.sidebarCollapsed : ''}
      `}
    >
      <Sidebar
        userRole={userRole}
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
      />
      <TopBar />
      <main className={styles.dashboardMain}>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
