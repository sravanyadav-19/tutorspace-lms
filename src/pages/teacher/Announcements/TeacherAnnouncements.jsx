import React, { useState, useEffect } from 'react'
import { Megaphone, BookOpen, Plus, Trash2, MessageCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Send, X } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import EmptyState from '../../../components/shared/EmptyState'
import { classAPI, announcementAPI } from '../../../services/api'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import styles from './TeacherAnnouncements.module.css'

const TeacherAnnouncements = () => {
  const toast = useToast()

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [error, setError] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [posting, setPosting] = useState(false)

  const [expandedComments, setExpandedComments] = useState({})
  const [commentsLoading, setCommentsLoading] = useState({})

  const [confirmModal, setConfirmModal] = useState({ open: false, announcementId: null })
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass?.id) fetchAnnouncements(selectedClass.id) }, [selectedClass])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      const tc = res?.data?.data?.classes || []
      setClasses(tc)
      if (tc.length > 0) setSelectedClass(tc[0])
    } catch (err) {
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async (classId) => {
    try {
      setAnnouncementsLoading(true)
      const res = await announcementAPI.getClassAnnouncements(classId)
      setAnnouncements(res?.data?.data?.announcements || [])
    } catch (err) {
      setAnnouncements([])
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    if (!selectedClass?.id) {
      toast.error('Please select a class')
      return
    }

    setPosting(true)
    try {
      await announcementAPI.createAnnouncement(selectedClass.id, formData)
      toast.success('Announcement posted successfully!')
      setFormData({ title: '', content: '' })
      setShowCreateForm(false)
      fetchAnnouncements(selectedClass.id)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post announcement')
    } finally {
      setPosting(false)
    }
  }

  const toggleComments = async (announcementId) => {
    if (expandedComments[announcementId]) {
      setExpandedComments(prev => ({ ...prev, [announcementId]: false }))
      return
    }
    setCommentsLoading(prev => ({ ...prev, [announcementId]: true }))
    try {
      const res = await announcementAPI.getAnnouncementComments(announcementId)
      setExpandedComments(prev => ({ ...prev, [announcementId]: res?.data?.data?.comments || [] }))
    } catch (err) {
      setExpandedComments(prev => ({ ...prev, [announcementId]: [] }))
    } finally {
      setCommentsLoading(prev => ({ ...prev, [announcementId]: false }))
    }
  }

  const promptDelete = (announcementId) => setConfirmModal({ open: true, announcementId })

  const handleDelete = async () => {
    const { announcementId } = confirmModal
    if (!announcementId) return
    setDeleting(announcementId)
    try {
      await announcementAPI.deleteAnnouncement(announcementId)
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
      toast.success('Announcement deleted successfully')
    } catch (err) {
      toast.error('Failed to delete announcement')
    } finally {
      setDeleting(null)
      setConfirmModal({ open: false, announcementId: null })
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const formatDateTime = (dateString) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.announcementsPage}>
        <div className={styles.pageHeader}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>
              <Megaphone size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Announcements
            </h1>
            <p className={styles.pageSubtitle}>Post and manage class updates for your students</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => fetchClasses()}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? <><X size={16} style={{ marginRight: '6px' }} /> Cancel</> : <><Plus size={16} style={{ marginRight: '6px' }} /> New Announcement</>}
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : (classes || []).length === 0 ? (
          <EmptyState
            icon="classes"
            title="No Classes Assigned"
            message="You need to be assigned to a class before posting announcements."
          />
        ) : (
          <div className={styles.contentLayout}>
            {/* Class Sidebar Selector */}
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {(classes || []).map(cls => (
                  <button
                    key={cls.id}
                    className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`}
                    onClick={() => { setSelectedClass(cls); setShowCreateForm(false) }}
                  >
                    <BookOpen size={16} />
                    <div className={styles.classItemInfo}>
                      <p className={styles.classItemName}>{cls.name}</p>
                      <p className={styles.classItemSubject}>{cls.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
              {showCreateForm && (
                <form onSubmit={handlePostAnnouncement} className={styles.createForm}>
                  <h2 className={styles.formTitle}>
                    <Megaphone size={18} style={{ marginRight: '6px' }} />
                    Post Announcement to {selectedClass?.name}
                  </h2>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Title *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Test Next Week, Room Change..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Content *</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Write your announcement details here..."
                      rows={5}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formActions}>
                    <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={posting} disabled={posting}>
                      {posting ? 'Posting...' : <><Send size={16} style={{ marginRight: '6px' }} /> Post Announcement</>}
                    </Button>
                  </div>
                </form>
              )}

              <div className={styles.announcementsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Updates for {selectedClass?.name}
                  </h2>
                  <span className={styles.countBadge}>{(announcements || []).length} posted</span>
                </div>

                {announcementsLoading ? <SkeletonGrid count={2} type="card" /> : (announcements || []).length === 0 ? (
                  <EmptyState
                    icon="announcements"
                    title="No Announcements Posted"
                    message={`No updates have been posted to ${selectedClass?.name} yet.`}
                    size="sm"
                  />
                ) : (
                  <div className={styles.announcementsList}>
                    {(announcements || []).map(a => {
                      const comments = expandedComments[a.id]
                      const isExpanded = Array.isArray(comments)
                      const isLoading = commentsLoading[a.id]

                      return (
                        <div key={a.id} className={styles.announcementCard}>
                          <div className={styles.cardHeader}>
                            <h3 className={styles.announcementTitle}>{a.title}</h3>
                            <div className={styles.cardHeaderRight}>
                              <span className={styles.postDate}>{formatDate(a.createdAt)}</span>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => promptDelete(a.id)}
                                title="Delete announcement"
                                aria-label="Delete announcement"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <p className={styles.announcementContent}>{a.content}</p>

                          <button
                            className={styles.commentToggleBtn}
                            onClick={() => toggleComments(a.id)}
                          >
                            <MessageCircle size={14} style={{ marginRight: '6px' }} />
                            {a._count?.comments || 0} comments
                            {isExpanded ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
                          </button>

                          {isExpanded && (
                            <div className={styles.commentsThread}>
                              {comments.length === 0 ? (
                                <p className={styles.noComments}>No comments yet.</p>
                              ) : (
                                comments.map(comment => (
                                  <div key={comment.id} className={styles.commentCard}>
                                    <div className={styles.commentAvatar}>
                                      {(comment.author?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className={styles.commentBody}>
                                      <div className={styles.commentMeta}>
                                        <span className={styles.commentAuthor}>{comment.author?.name}</span>
                                        <span className={`${styles.roleBadge} ${styles[`role-${comment.author?.role?.name}`]}`}>
                                          {comment.author?.role?.name}
                                        </span>
                                        <span className={styles.commentTime}>{formatDateTime(comment.createdAt)}</span>
                                      </div>
                                      <p className={styles.commentText}>{comment.commentText}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {isLoading && <p className={styles.commentsLoading}>Loading comments...</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, announcementId: null })}
          onConfirm={handleDelete}
          title="Delete Announcement"
          message="Delete this announcement? All comments will also be permanently removed."
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={!!deleting}
        />
      </div>
    </DashboardLayout>
  )
}

export default TeacherAnnouncements