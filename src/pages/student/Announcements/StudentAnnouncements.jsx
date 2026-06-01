import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, BookOpen, RefreshCw, MessageCircle, ArrowRight, AlertCircle, Target } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI, announcementAPI } from '../../../services/api'
import styles from './StudentAnnouncements.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import EmptyState from '../../../components/shared/EmptyState'

const StudentAnnouncements = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass) fetchAnnouncements(selectedClass.id) }, [selectedClass])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getStudentClasses()
      const studentClasses = res.data.data.classes
      setClasses(studentClasses)
      if (studentClasses.length > 0) setSelectedClass(studentClasses[0])
    } catch (err) { setError('Failed to load classes') }
    finally { setLoading(false) }
  }

  const fetchAnnouncements = async (classId) => {
    try { setAnnouncementsLoading(true); const res = await announcementAPI.getClassAnnouncements(classId); setAnnouncements(res.data.data.announcements) }
    catch (err) { setAnnouncements([]) }
    finally { setAnnouncementsLoading(false) }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString); const now = new Date(); const diff = now - date
    const minutes = Math.floor(diff / 60000); const hours = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000)
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.announcementsPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><Megaphone size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Announcements</h1>
            <p className={styles.pageSubtitle}>Stay updated with your class announcements</p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {error && <div className={styles.errorState} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : classes.length === 0 ? (
          <EmptyState
            icon="classes"
            title="No Classes Found"
            message="You are not enrolled in any classes yet."
          />
        ) : (
          <div className={styles.contentLayout}>
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {classes.map(cls => (
                  <button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`} onClick={() => setSelectedClass(cls)}>
                    <BookOpen size={16} />
                    <div className={styles.classItemInfo}><p className={styles.classItemName}>{cls.name}</p><p className={styles.classItemSubject}>{cls.subject}</p></div>
                    <span className={styles.classItemCount}>{cls._count?.announcements || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.announcementsFeed}>
              {selectedClass && (
                <div className={styles.feedHeader}>
                  <h2 className={styles.feedTitle}>{selectedClass.name}</h2>
                  <p className={styles.feedSubtitle}>{selectedClass.subject} • {announcements.length} announcements</p>
                </div>
              )}

              {announcementsLoading ? <SkeletonGrid count={3} type="card" /> : announcements.length === 0 ? (
                <EmptyState
                  icon="announcements"
                  title="No Announcements Yet"
                  message="Your teacher hasn't posted any announcements yet. Check back soon!"
                  size="sm"
                />
              ) : (
                <div className={styles.announcementsList}>
                  {announcements.map(announcement => (
                    <div key={announcement.id} className={styles.announcementCard} onClick={() => navigate(`/student/announcements/${announcement.id}`)}>
                      <div className={styles.announcementHeader}>
                        <div className={styles.authorInfo}>
                          <div className={styles.authorAvatar}><Target size={20} color="#cc785c" /></div>
                          <div className={styles.authorDetails}>
                            <p className={styles.authorName}>{announcement.author?.name || 'Teacher'}</p>
                            <p className={styles.postTime}>{formatDate(announcement.createdAt)}</p>
                          </div>
                        </div>
                        <div className={styles.announcementMeta}>
                          <span className={styles.commentCount}><MessageCircle size={12} /> {announcement._count?.comments || 0} comments</span>
                        </div>
                      </div>
                      <div className={styles.announcementContent}>
                        <h3 className={styles.announcementTitle}>{announcement.title}</h3>
                        <p className={styles.announcementText}>{announcement.content.length > 200 ? announcement.content.substring(0, 200) + '...' : announcement.content}</p>
                      </div>
                      <div className={styles.announcementFooter}><span className={styles.readMore}>Read more & comment <ArrowRight size={12} /></span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentAnnouncements