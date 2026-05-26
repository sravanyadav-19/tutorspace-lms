import React from 'react'
import { User } from 'lucide-react'
import PageIcon from '../components/shared/PageIcon/PageIcon'
import styles from './ActivityFeed.module.css'

const ActivityFeed = ({ 
  title, 
  items = [], 
  emptyMessage = 'No activity yet' 
}) => {
  return (
    <div className={styles.feedContainer}>
      <h3 className={styles.feedTitle}>{title}</h3>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.feedList}>
          {items.map((item, index) => (
            <div key={index} className={styles.feedItem}>
              <div className={styles.feedIcon}>
                {item.iconName ? (
                  <PageIcon name={item.iconName} size={18} />
                ) : typeof item.icon === 'string' && item.icon.length <= 2 ? (
                  <span role="img" aria-label="activity">{item.icon}</span>
                ) : (
                  <User size={18} strokeWidth={2} />
                )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityFeed
