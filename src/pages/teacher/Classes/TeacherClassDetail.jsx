import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Megaphone, ClipboardList, FileText, BookOpen, Plus, Trash2, MessageCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
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
  const [confirmModal, setConfirmModal] = useState({ open: false, announcementId: null })
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchData() }, [classId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [classRes, announcementsRes] = await Promise.all([
        classAPI.getClassById(classId), announcementAPI.getClassAnnouncements(classId)
      ])
      setCls(classRes.data.data.class)
      setAnnouncements(announcementsRes.data.data.announcements || [])
    } catch (err) { setError('Failed to load class details') }
    finally { setLoading(false) }
  }

  const promptDeleteAnnouncement = (announcementId) => setConfirmModal({ open: true, announcementId })

  const handleDeleteAnnouncement = async () => {
    const { announcementId } = confirmModal
    if (!announcementId) return
    setDeleting(announcementId)
    try {
      await announcementAPI.deleteAnnouncement(announcementId)
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
    } catch (err) { setError('Failed to delete announcement') }
    finally { setDeleting(null); setConfirmModal({ open: false, announcementId: null }) }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const enrolledStudents = cls?.enrollments?.filter(e => e.user?.role?.name === 'student') || []

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}><SkeletonCard /><SkeletonGrid count={2} type="card" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.classDetailPage}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/teacher/classes')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Classes</button>
          <div className={styles.headerRow}>
            <div><h1 className={styles.pageTitle}>{cls?.name}</h1><p className={styles.pageSubtitle}>{cls?.subject}</p></div>
            <Button variant="primary" onClick={() => navigate(`/teacher/classes/${classId}/announcements/new`)}><Plus size={16} style={{ marginRight: '6px' }} /> New Announcement</Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        <div className={styles.statsRow}>
          <div className={styles.statCard}><GraduationCap size={22} color="var(--color-primary)" /><div><p className={styles.statValue}>{enrolledStudents.length}</p><p className={styles.statLabel}>Students</p></div></div>
          <div className={styles.statCard}><Megaphone size={22} color="var(--color-primary)" /><div><p className={styles.statValue}>{announcements.length}</p><p className={styles.statLabel}>Announcements</p></div></div>
          <div className={styles.statCard}><ClipboardList size={22} color="var(--color-primary)" /><div><p className={styles.statValue}>{cls?._count?.quizzes || 0}</p><p className={styles.statLabel}>Quizzes</p></div></div>
          <div className={styles.statCard}><FileText size={22} color="var(--color-primary)" /><div><p className={styles.statValue}>{cls?._count?.files || 0}</p><p className={styles.statLabel}>Files</p></div></div>
        </div>

        <div className={styles.tabs}>
          {['overview', 'announcements', 'students'].map(tab => (
            <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && <><BookOpen size={14} style={{ marginRight: '4px' }} /> Overview</>}
              {tab === 'announcements' && <><Megaphone size={14} style={{ marginRight: '4px' }} /> Announcements ({announcements.length})</>}
              {tab === 'students' && <><GraduationCap size={14} style={{ marginRight: '4px' }} /> Students ({enrolledStudents.length})</>}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.overviewCard}>
              <h3 className={styles.cardTitle}><BookOpen size={18} style={{ marginRight: '6px' }} /> Class Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Class Name</p><p className={styles.infoValue}>{cls?.name}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Subject</p><p className={styles.infoValue}>{cls?.subject}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Status</p><p className={styles.infoValue}>{cls?.status}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Created</p><p className={styles.infoValue}>{formatDate(cls?.createdAt)}</p></div>
                {cls?.description && <div className={`${styles.infoItem} ${styles.infoItemFull}`}><p className={styles.infoLabel}>Description</p><p className={styles.infoValue}>{cls?.description}</p></div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className={styles.tabContent}>
            <div className={styles.announcementsSection}>
              {announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Megaphone size={32} color="var(--color-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p className={styles.emptyText}>No announcements yet. Create your first one!</p>
                  <Button variant="primary" onClick={() => navigate(`/teacher/classes/${classId}/announcements/new`)}><Plus size={16} style={{ marginRight: '6px' }} /> New Announcement</Button>
                </div>
              ) : (
                <div className={styles.announcementsList}>
                  {announcements.map(announcement => (
                    <div key={announcement.id} className={styles.announcementCard}>
                      <div className={styles.announcementHeader}>
                        <h3 className={styles.announcementTitle}>{announcement.title}</h3>
                        <div className={styles.announcementActions}>
                          <span className={styles.announcementDate}>{formatDate(announcement.createdAt)}</span>
                          <button className={styles.deleteAnnouncementBtn} onClick={() => promptDeleteAnnouncement(announcement.id)}><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <p className={styles.announcementContent}>{announcement.content.length > 200 ? announcement.content.substring(0, 200) + '...' : announcement.content}</p>
                      <p className={styles.announcementMeta}><MessageCircle size={12} style={{ marginRight: '4px' }} /> {announcement._count?.comments || 0} comments</p>
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
                <div className={styles.emptyState}><GraduationCap size={32} color="var(--color-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} /><p className={styles.emptyText}>No students enrolled yet.</p></div>
              ) : (
                <div className={styles.studentsList}>
                  {enrolledStudents.map(enrollment => (
                    <div key={enrollment.id} className={styles.studentCard}>
                      <div className={styles.studentAvatar}>{enrollment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={styles.studentInfo}><p className={styles.studentName}>{enrollment.user?.name}</p><p className={styles.studentEmail}>{enrollment.user?.email}</p></div>
                      <span className={styles.enrolledDate}>Enrolled {formatDate(enrollment.enrolledAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, announcementId: null })} onConfirm={handleDeleteAnnouncement} title="Delete Announcement" message="Are you sure you want to delete this announcement? All associated comments will also be removed. This cannot be undone." confirmLabel="Delete Announcement" confirmVariant="danger" loading={!!deleting} />
      </div>
    </DashboardLayout>
  )
}

export default TeacherClassDetail