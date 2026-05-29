import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Trash2, Target, GraduationCap, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import ConfirmModal from '../../../../components/shared/ConfirmModal'
import { Textarea } from '../../../../components/shared/Input'
import { useAuth } from '../../../../context/AuthContext'
import { useToast } from '../../../../context/ToastContext'
import { announcementAPI } from '../../../../services/api'
import styles from './AnnouncementDetail.module.css'
import { SkeletonCard } from '../../../../components/shared/Skeleton/Skeleton'

const AnnouncementDetail = () => {
  const { announcementId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [announcement, setAnnouncement] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, commentId: null })
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchAnnouncementData() }, [announcementId])

  const fetchAnnouncementData = async () => {
    try { setLoading(true); const commentsRes = await announcementAPI.getAnnouncementComments(announcementId); setComments(commentsRes.data.data.comments) }
    catch (err) { setError('Failed to load announcement') }
    finally { setLoading(false) }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommentLoading(true)
    try { const res = await announcementAPI.addComment(announcementId, { content: newComment.trim() }); setComments(prev => [...prev, res.data.data.comment]); setNewComment(''); toast.success('Comment posted') }
    catch (err) { toast.error('Failed to add comment') }
    finally { setCommentLoading(false) }
  }

  const promptDelete = (commentId) => setConfirmModal({ open: true, commentId })

  const handleDeleteComment = async () => {
    const { commentId } = confirmModal
    if (!commentId) return
    setDeleting(commentId)
    try { await announcementAPI.deleteComment(commentId); setComments(prev => prev.filter(c => c.id !== commentId)); toast.success('Comment deleted') }
    catch (err) { toast.error('Failed to delete comment') }
    finally { setDeleting(null); setConfirmModal({ open: false, commentId: null }) }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return (<DashboardLayout userRole="student"><SkeletonCard /></DashboardLayout>)

  if (error) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.errorState} role="alert"><p><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</p><Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Go Back</Button></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.announcementDetail}>
        <button className={styles.backBtn} onClick={() => navigate('/student/announcements')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Announcements</button>

        <div className={styles.announcementCard}>
          <div className={styles.announcementHeader}>
            <div className={styles.authorInfo}>
              <div className={styles.authorAvatar}><Target size={20} color="var(--color-primary)" /></div>
              <div className={styles.authorDetails}><p className={styles.authorName}>Teacher</p><p className={styles.postTime}>Announcement #{announcementId}</p></div>
            </div>
          </div>
          <div className={styles.announcementContent}><p className={styles.announcementText}>Click on an announcement from the list to view details</p></div>
        </div>

        <div className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}><MessageCircle size={18} style={{ marginRight: '6px' }} /> Comments ({comments.length})</h2>
          <form onSubmit={handleAddComment} className={styles.addCommentForm}>
            <Textarea placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
            <div className={styles.commentActions}>
              <Button type="submit" variant="primary" loading={commentLoading} disabled={commentLoading || !newComment.trim()}>{commentLoading ? 'Posting...' : <><MessageCircle size={14} style={{ marginRight: '4px' }} /> Post Comment</>}</Button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className={styles.noComments}><p>No comments yet. Be the first to comment!</p></div>
          ) : (
            <div className={styles.commentsList}>
              {comments.map(comment => (
                <div key={comment.id} className={styles.commentCard}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAuthor}>
                      <div className={styles.commentAvatar}>{comment.author?.role?.name === 'teacher' ? <Target size={16} color="var(--color-primary)" /> : <GraduationCap size={16} color="var(--color-info)" />}</div>
                      <div className={styles.commentAuthorInfo}>
                        <p className={styles.commentAuthorName}>{comment.author?.name}{comment.author?.role?.name === 'teacher' && <span className={styles.teacherBadge}>Teacher</span>}</p>
                        <p className={styles.commentTime}>{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                    {comment.author?.id === user?.id && (
                      <button className={styles.deleteCommentBtn} onClick={() => promptDelete(comment.id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                  <p className={styles.commentText}>{comment.commentText}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, commentId: null })} onConfirm={handleDeleteComment} title="Delete Comment" message="Are you sure you want to delete this comment? This cannot be undone." confirmLabel="Delete Comment" confirmVariant="danger" loading={!!deleting} />
      </div>
    </DashboardLayout>
  )
}

export default AnnouncementDetail