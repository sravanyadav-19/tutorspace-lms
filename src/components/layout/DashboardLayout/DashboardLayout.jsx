import React from 'react'
import Sidebar from '../Sidebar'
import TopBar from '../TopBar'
import styles from './DashboardLayout.module.css'

const DashboardLayout = ({ children, userRole = 'student' }) => {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar userRole={userRole} />
      <TopBar />
      <main className={styles.dashboardMain}>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
