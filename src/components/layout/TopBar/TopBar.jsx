import React from 'react'
import { Bell, Settings } from 'lucide-react'
import Button from '../../shared/Button'
import styles from './TopBar.module.css'

const TopBar = ({ userName = 'John Doe' }) => {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        {/* Breadcrumb or page title could go here */}
      </div>
      
      <div className={styles.topbarRight}>
        <Button variant="ghost" className={styles.iconButton}>
          <Bell size={20} />
        </Button>
        
        <Button variant="ghost" className={styles.iconButton}>
          <Settings size={20} />
        </Button>
        
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
          <div className={styles.userAvatar}>
            {userName.split(' ').map(name => name[0]).join('').toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
