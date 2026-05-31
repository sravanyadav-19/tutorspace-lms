import React from 'react'
import { BookOpen, FileText, ClipboardList, Megaphone, Trophy, Inbox, BarChart3, Users, FolderOpen, GraduationCap } from 'lucide-react'
import Button from '../Button/Button'
import styles from './EmptyState.module.css'

const iconMap = {
  classes: BookOpen,
  files: FileText,
  quizzes: ClipboardList,
  announcements: Megaphone,
  results: Trophy,
  inbox: Inbox,
  analytics: BarChart3,
  users: Users,
  folder: FolderOpen,
  default: GraduationCap,
}

const EmptyState = ({ 
  icon = 'default',
  title = 'Nothing here yet',
  message = '',
  actionLabel,
  onAction,
  size = 'lg'
}) => {
  const Icon = iconMap[icon] || iconMap.default

  return (
    <div className={styles.container}>
      <div className={`${styles.iconWrapper} ${styles[`iconWrapper${size === 'sm' ? 'Sm' : 'Lg'}`]}`}>
        <Icon size={size === 'sm' ? 32 : 48} strokeWidth={1.5} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState