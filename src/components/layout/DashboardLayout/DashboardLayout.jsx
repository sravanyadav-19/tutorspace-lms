import React, { useState, useEffect } from 'react'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import styles from './DashboardLayout.module.css'

const DashboardLayout = ({ children, userRole = 'student' }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }

  const handleClose = () => setMobileOpen(false)

  return (
    <div className={`
      ${styles.dashboardLayout}
      ${!isMobile && isCollapsed ? styles.sidebarCollapsed : ''}
    `}>
      <Sidebar
        userRole={userRole}
        isOpen={mobileOpen}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        onClose={handleClose}
      />
      <TopBar onMenuClick={handleMenuClick} />
      <main
        className={styles.dashboardMain}
        id="main-content"
        role="main"
        aria-label="Main content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout