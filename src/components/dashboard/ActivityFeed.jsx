import React from 'react'
import { User, Target, GraduationCap, BookOpen } from 'lucide-react'
import styles from './ActivityFeed.module.css'

const iconRender = (icon) => {
  switch (icon) {
    case 'teacher': return <Target size={18} strokeWidth={2} />
    case 'student': return <GraduationCap size={18} strokeWidth={2} />
    case 'class': return <BookOpen size={18} strokeWidth={2} />
    default:
      if (typeof icon === 'string') return <span>{icon}</span>
      return <User size={18} strokeWidth={2} />
  }
}

const ActivityFeed = ({ 
  title, 
  items = [], 
  emptyMessage = 'No activity yet' 
}) => {
  return (
    <div
      className={styles.feedContainer}
      role="region"
      aria-label={title}
    >
      <h3 className={styles.feedTitle}>{title}</h3>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{emptyMessage}</p>
        </div>
      ) : (
        <ul className={styles.feedList} role="list">
          {items.map((item, index) => (
            <li key={index} className={styles.feedItem}>
              <div className={styles.feedIcon} aria-hidden="true">
                {iconRender(item.icon)}
              </div>
              <div className={styles.feedContent}>
                <p className={styles.feedName}>{item.name}</p>
                <p className={styles.feedMeta}>{item.meta}</p>
              </div>
              <div className={styles.feedRight}>
                {item.badge && (
                  <span className={`${styles.badge} ${styles[`badge-${item.badgeColor}`]}`}>
                    {item.badge}
                  </span>
                )}
                {item.time && <span className={styles.feedTime}>{item.time}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityFeed