import React, { useState, useEffect } from 'react'
import { BookOpen, BarChart3, ClipboardList, RefreshCw, Users, CheckCircle, Clock, AlertCircle, Play, Pause } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import EmptyState from '../../../components/shared/EmptyState'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { classAPI, quizAPI } from '../../../services/api'
import styles from './TeacherAnalytics.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'

const TeacherAnalytics = () => {
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, quizId: null })
  const [releasing, setReleasing] = useState(null)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass) fetchQuizzes(selectedClass.id) }, [selectedClass])
  useEffect(() => { if (selectedQuiz) fetchSubmissions(selectedQuiz.id) }, [selectedQuiz])

  const fetchClasses = async () => {
    try { setLoading(true); const res = await classAPI.getTeacherClasses(); const tc = res.data.data.classes; setClasses(tc); if (tc.length > 0) setSelectedClass(tc[0]) }
    catch (err) { setError('Failed to load classes') }
    finally { setLoading(false) }
  }

  const fetchQuizzes = async (classId) => {
    try { setQuizzesLoading(true); setSelectedQuiz(null); setSubmissions([]); const res = await quizAPI.getClassQuizzes(classId); const cq = res.data.data.quizzes; setQuizzes(cq); if (cq.length > 0) setSelectedQuiz(cq[0]) }
    catch (err) { setQuizzes([]) }
    finally { setQuizzesLoading(false) }
  }

  const fetchSubmissions = async (quizId) => {
    try { setSubmissionsLoading(true); const res = await quizAPI.getSubmissions(quizId); setSubmissions(res.data.data.submissions || []) }
    catch (err) { setSubmissions([]) }
    finally { setSubmissionsLoading(false) }
  }

  const promptRelease = (quizId) => setConfirmModal({ open: true, quizId })

  const handleReleaseResults = async () => {
    const { quizId } = confirmModal; if (!quizId) return
    setReleasing(quizId)
    try { await quizAPI.releaseResults(quizId); toast.success('Results released to all students!') }
    catch (err) { toast.error('Failed to release results') }
    finally { setReleasing(null); setConfirmModal({ open: false, quizId: null }) }
  }

  const getAnalytics = () => {
    if (!submissions.length) return null
    const scores = submissions.map(s => Math.round((s.score / s.totalPoints) * 100))
    return { avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), highest: Math.max(...scores), lowest: Math.min(...scores), passed: scores.filter(s => s >= 50).length, total: submissions.length }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const getScoreColor = (percent) => { if (percent >= 80) return styles.scoreHigh; if (percent >= 50) return styles.scoreMid; return styles.scoreLow }
  const analytics = getAnalytics()

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.analyticsPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><BarChart3 size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Analytics</h1>
            <p className={styles.pageSubtitle}>View quiz performance and student submissions</p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}><SkeletonGrid count={2} type="card" /><SkeletonGrid count={4} type="stat" /></div>
        ) : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3><p className={styles.emptyText}>You need to be assigned to a class first.</p>
          </div>
        ) : (
          <div className={styles.contentLayout}>
            <div className={styles.leftSidebar}>
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Classes</h3>
                <div className={styles.classList}>
                  {classes.map(cls => (
                    <button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`} onClick={() => setSelectedClass(cls)}>
                      <BookOpen size={14} /><div className={styles.classItemInfo}><p className={styles.classItemName}>{cls.name}</p><p className={styles.classItemSubject}>{cls.subject}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Quizzes</h3>
                {quizzesLoading ? <p className={styles.sidebarLoading}>Loading...</p> : quizzes.length === 0 ? <p className={styles.sidebarEmpty}>No quizzes yet</p> : (
                  <div className={styles.quizList}>
                    {quizzes.map(quiz => (
                      <button key={quiz.id} className={`${styles.quizItem} ${selectedQuiz?.id === quiz.id ? styles.quizItemActive : ''}`} onClick={() => setSelectedQuiz(quiz)}>
                        <p className={styles.quizItemTitle}>{quiz.title}</p>
                        <div className={styles.quizItemMeta}>
                          <span>{quiz._count?.submissions || 0} submissions</span>
                          <span className={`${styles.quizItemStatus} ${quiz.isPublished ? styles.publishedStatus : styles.draftStatus}`}>{quiz.isPublished ? <Play size={10} /> : <Pause size={10} />}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.mainContent}>
              {!selectedQuiz ? (
                <EmptyState icon="analytics" title="Select a Quiz" message="Choose a quiz from the left sidebar to view analytics" size="sm" />
              ) : (
                <>
                  <div className={styles.quizAnalyticsHeader}><div><h2 className={styles.quizAnalyticsTitle}>{selectedQuiz.title}</h2><p className={styles.quizAnalyticsMeta}>{selectedClass?.name} • {selectedQuiz._count?.questions || 0} questions • {submissions.length} submissions</p></div><button className={styles.releaseBtn} onClick={() => promptRelease(selectedQuiz.id)}><BarChart3 size={16} style={{ marginRight: '6px' }} /> Release Results</button></div>
                  {analytics && (
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}><p className={styles.statLabel}>Average Score</p><p className={`${styles.statValue} ${getScoreColor(analytics.avg)}`}>{analytics.avg}%</p></div>
                      <div className={styles.statCard}><p className={styles.statLabel}>Highest Score</p><p className={`${styles.statValue} ${styles.scoreHigh}`}>{analytics.highest}%</p></div>
                      <div className={styles.statCard}><p className={styles.statLabel}>Lowest Score</p><p className={`${styles.statValue} ${getScoreColor(analytics.lowest)}`}>{analytics.lowest}%</p></div>
                      <div className={styles.statCard}><p className={styles.statLabel}>Pass Rate</p><p className={`${styles.statValue} ${getScoreColor((analytics.passed / analytics.total) * 100)}`}>{Math.round((analytics.passed / analytics.total) * 100)}%</p><p className={styles.statSub}>{analytics.passed}/{analytics.total} passed</p></div>
                    </div>
                  )}
                  <div className={styles.submissionsSection}>
                    <h3 className={styles.submissionsSectionTitle}><Users size={18} style={{ marginRight: '6px' }} /> Student Submissions</h3>
                    {submissionsLoading ? <SkeletonCard /> : submissions.length === 0 ? <div className={styles.emptySubmissions}><p>No submissions yet for this quiz.</p></div> : (
                      <div className={styles.submissionsTable}>
                        <div className={styles.tableHeader}><span>Student</span><span>Score</span><span>Percentage</span><span>Submitted</span><span>Status</span></div>
                        {submissions.map(submission => {
                          const percent = Math.round((submission.score / submission.totalPoints) * 100)
                          return (
                            <div key={submission.id} className={styles.tableRow}>
                              <div className={styles.studentInfo}><div className={styles.studentAvatar}>{submission.student?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div><div><p className={styles.studentName}>{submission.student?.name}</p><p className={styles.studentEmail}>{submission.student?.email}</p></div></div>
                              <span className={styles.scoreRaw}>{submission.score}/{submission.totalPoints}</span>
                              <span className={`${styles.scorePercent} ${getScoreColor(percent)}`}>{percent}%</span>
                              <span className={styles.submittedAt}>{formatDate(submission.submittedAt)}</span>
                              <span className={`${styles.releasedStatus} ${submission.isReleased ? styles.released : styles.notReleased}`}>{submission.isReleased ? <><CheckCircle size={12} /> Released</> : <><Clock size={12} /> Pending</>}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, quizId: null })} onConfirm={handleReleaseResults} title="Release Quiz Results" message="Are you sure you want to release results to all students? They will be able to see their scores and answer reviews. This cannot be undone." confirmLabel="Release Results" confirmVariant="primary" loading={!!releasing} />
      </div>
    </DashboardLayout>
  )
}

export default TeacherAnalytics