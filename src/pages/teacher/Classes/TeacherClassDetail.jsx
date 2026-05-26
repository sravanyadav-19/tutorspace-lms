import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI, announcementAPI } from '../../../services/api'
import styles from './TeacherClassDetail.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'

const TeacherClassDetail = () => {
  const { classId } = useParams()
  const navigate = useNavigate()

  const [cls, setCls] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { fetchData() }, [classId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [classRes, announcementsRes] = await Promise.all([
        classAPI.getClassById(classId),
        announcementAPI.getClassAnnouncements(classId)
      ])
      setCls(classRes.data.data.class)
      setAnnouncements(announcementsRes.data.data.announcements || [])
    } catch (err) {
      setError('Failed to load class details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await announcementAPI.deleteAnnouncement(announcementId)
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
    } catch (err) {
      setError('Failed to delete announcement')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const enrolledStudents = cls?.enrollments?.filter(
    e => e.user?.role?.name === 'student'
  ) || []

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SkeletonCard />
          <SkeletonGrid count={2} type="card" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.classDetailPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/teacher/classes')}
          >
            ← Back to Classes
          </button>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>{cls?.name}</h1>
              <p className={styles.pageSubtitle}>{cls?.subject}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(
                `/teacher/classes/${classId}/announcements/new`
              )}
            >
              + New Announcement
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎓</span>
            <div>
              <p className={styles.statValue}>{enrolledStudents.length}</p>
              <p className={styles.statLabel}>Students</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📢</span>
            <div>
              <p className={styles.statValue}>{announcements.length}</p>
              <p className={styles.statLabel}>Announcements</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📝</span>
            <div>
              <p className={styles.statValue}>{cls?._count?.quizzes || 0}</p>
              <p className={styles.statLabel}>Quizzes</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📄</span>
            <div>
              <p className={styles.statValue}>{cls?._count?.files || 0}</p>
              <p className={styles.statLabel}>Files</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['overview', 'announcements', 'students'].map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📋 Overview'}
              {tab === 'announcements' && `📢 Announcements (${announcements.length})`}
              {tab === 'students' && `🎓 Students (${enrolledStudents.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.overviewCard}>
              <h3 className={styles.cardTitle}>📋 Class Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Class Name</p>
                  <p className={styles.infoValue}>{cls?.name}</p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Subject</p>
                  <p className={styles.infoValue}>{cls?.subject}</p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Status</p>
                  <p className={styles.infoValue}>{cls?.status}</p>
                </div>
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>Created</p>
                  <p className={styles.infoValue}>{formatDate(cls?.createdAt)}</p>
                </div>
                {cls?.description && (
                  <div className={`${styles.infoItem} ${styles.infoItemFull}`}>
                    <p className={styles.infoLabel}>Description</p>
                    <p className={styles.infoValue}>{cls?.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className={styles.tabContent}>
            <div className={styles.announcementsSection}>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>
                    No announcements yet. Create your first one!
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate(
                      `/teacher/classes/${classId}/announcements/new`
                    )}
                  >
                    + New Announcement
                  </Button>
                </div>
              ) : (
                <div className={styles.announcementsList}>
                  {announcements.map(announcement => (
                    <div
                      key={announcement.id}
                      className={styles.announcementCard}
                    >
                      <div className={styles.announcementHeader}>
                        <h3 className={styles.announcementTitle}>
                          {announcement.title}
                        </h3>
                        <div className={styles.announcementActions}>
                          <span className={styles.announcementDate}>
                            {formatDate(announcement.createdAt)}
                          </span>
                          <button
                            className={styles.deleteAnnouncementBtn}
                            onClick={() => handleDeleteAnnouncement(
                              announcement.id
                            )}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className={styles.announcementContent}>
                        {announcement.content.length > 200
                          ? announcement.content.substring(0, 200) + '...'
                          : announcement.content}
                      </p>
                      <p className={styles.announcementMeta}>
                        💬 {announcement._count?.comments || 0} comments
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className={styles.tabContent}>
            <div className={styles.studentsSection}>
              {enrolledStudents.length === 0 ? (
                <p className={styles.emptyText}>No students enrolled yet.</p>
              ) : (
                <div className={styles.studentsList}>
                  {enrolledStudents.map(enrollment => (
                    <div key={enrollment.id} className={styles.studentCard}>
                      <div className={styles.studentAvatar}>
                        {enrollment.user?.name
                          ?.split(' ').map(n => n[0]).join('')
                          .toUpperCase().slice(0, 2)}
                      </div>
                      <div className={styles.studentInfo}>
                        <p className={styles.studentName}>
                          {enrollment.user?.name}
                        </p>
                        <p className={styles.studentEmail}>
                          {enrollment.user?.email}
                        </p>
                      </div>
                      <span className={styles.enrolledDate}>
                        Enrolled {formatDate(enrollment.enrolledAt)}
                      </span>
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

export default TeacherClassDetail
