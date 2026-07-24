import React, { useState, useEffect } from 'react'
import { BookOpen, BarChart3, RefreshCw, Users, CheckCircle, Clock, AlertCircle, Play, Pause, Hourglass } from 'lucide-react'
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
  useEffect(() => { if (selectedClass?.id) fetchQuizzes(selectedClass.id) }, [selectedClass])
  useEffect(() => { if (selectedQuiz?.id) fetchSubmissions(selectedQuiz.id) }, [selectedQuiz])

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

  const fetchQuizzes = async (classId) => {
    try {
      setQuizzesLoading(true)
      setSelectedQuiz(null)
      setSubmissions([])
      const res = await quizAPI.getClassQuizzes(classId)
      const cq = res?.data?.data?.quizzes || []
      setQuizzes(cq)
      if (cq.length > 0) setSelectedQuiz(cq[0])
    } catch (err) {
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  const fetchSubmissions = async (quizId) => {
    try {
      setSubmissionsLoading(true)
      const res = await quizAPI.getSubmissions(quizId)
      setSubmissions(res?.data?.data?.submissions || [])
    } catch (err) {
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const promptRelease = (quizId) => setConfirmModal({ open: true, quizId })

  const handleReleaseResults = async () => {
    const { quizId } = confirmModal
    if (!quizId) return
    setReleasing(quizId)
    try {
      const res = await quizAPI.releaseResults(quizId)
      toast.success(res?.data?.message || 'Results & scores released to all students!')
      // Refresh list + selected quiz release flags
      if (selectedClass?.id) {
        const qRes = await quizAPI.getClassQuizzes(selectedClass.id)
        const cq = qRes?.data?.data?.quizzes || []
        setQuizzes(cq)
        const updated = cq.find((q) => q.id === quizId)
        if (updated) setSelectedQuiz(updated)
      }
      if (selectedQuiz?.id) fetchSubmissions(selectedQuiz.id)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to release results')
    } finally {
      setReleasing(null)
      setConfirmModal({ open: false, quizId: null })
    }
  }

  const getAnalytics = () => {
    if (!submissions.length) return null
    const scores = submissions.map(s => Math.round((s.score / (s.totalPoints || 1)) * 100))
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)
    const passed = scores.filter(s => s >= 50).length
    return { avg, highest, lowest, passed, total: submissions.length }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const getScoreColor = (percent) => { if (percent >= 80) return styles.scoreHigh; if (percent >= 50) return styles.scoreMid; return styles.scoreLow }
  const analytics = getAnalytics()

  const unreleasedCount = submissions.filter((s) => !s.isReleased).length
  const allReleased =
    submissions.length > 0 && unreleasedCount === 0
  const canReleaseGrades = submissions.length > 0 && unreleasedCount > 0

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.analyticsPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <BarChart3 size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Class Analytics
            </h1>
            <p className={styles.pageSubtitle}>Track student performance, score distribution, and manage grade releases</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchClasses}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SkeletonGrid count={2} type="card" />
            <SkeletonGrid count={4} type="stat" />
          </div>
        ) : (classes || []).length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3>
            <p className={styles.emptyText}>You need to be assigned to a class before viewing performance analytics.</p>
          </div>
        ) : (
          <div className={styles.contentLayout}>
            {/* Sidebar Selectors */}
            <div className={styles.leftSidebar}>
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Classes</h3>
                <div className={styles.classList}>
                  {(classes || []).map(cls => (
                    <button
                      key={cls.id}
                      className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <BookOpen size={14} />
                      <div className={styles.classItemInfo}>
                        <p className={styles.classItemName}>{cls.name}</p>
                        <p className={styles.classItemSubject}>{cls.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Quizzes</h3>
                {quizzesLoading ? (
                  <p className={styles.sidebarLoading}>Loading quizzes...</p>
                ) : (quizzes || []).length === 0 ? (
                  <p className={styles.sidebarEmpty}>No quizzes in this class</p>
                ) : (
                  <div className={styles.quizList}>
                    {(quizzes || []).map((quiz) => {
                      const subs =
                        quiz.submissionCount ?? quiz._count?.submissions ?? 0
                      const needsRelease = quiz.hasUnreleased
                      const released = quiz.allReleased && subs > 0
                      return (
                        <button
                          key={quiz.id}
                          className={`${styles.quizItem} ${selectedQuiz?.id === quiz.id ? styles.quizItemActive : ''}`}
                          onClick={() => setSelectedQuiz(quiz)}
                        >
                          <p className={styles.quizItemTitle}>{quiz.title}</p>
                          <div className={styles.quizItemMeta}>
                            <span>
                              {subs} submission{subs === 1 ? '' : 's'}
                            </span>
                            {!quiz.isPublished ? (
                              <span className={`${styles.quizItemStatus} ${styles.draftStatus}`}>
                                <Pause size={10} /> Draft
                              </span>
                            ) : needsRelease ? (
                              <span className={`${styles.quizItemStatus} ${styles.needsReleaseStatus}`}>
                                <Hourglass size={10} /> Needs release
                              </span>
                            ) : released ? (
                              <span className={`${styles.quizItemStatus} ${styles.releasedSideStatus}`}>
                                <CheckCircle size={10} /> Released
                              </span>
                            ) : (
                              <span className={`${styles.quizItemStatus} ${styles.publishedStatus}`}>
                                <Play size={10} /> Live
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Pane */}
            <div className={styles.mainContent}>
              {!selectedQuiz ? (
                <EmptyState
                  icon="analytics"
                  title="Select a Quiz"
                  message="Choose a quiz from the list to view analytics and student score breakdowns."
                  size="sm"
                />
              ) : (
                <>
                  <div className={styles.quizAnalyticsHeader}>
                    <div>
                      <h2 className={styles.quizAnalyticsTitle}>{selectedQuiz.title}</h2>
                      <p className={styles.quizAnalyticsMeta}>
                        {selectedClass?.name} • {selectedQuiz._count?.questions || selectedQuiz.questions?.length || 0} questions • {submissions.length} submissions
                        {canReleaseGrades
                          ? ` • ${unreleasedCount} awaiting release`
                          : allReleased
                            ? ' • all grades released'
                            : ''}
                      </p>
                    </div>
                    {canReleaseGrades ? (
                      <button
                        type="button"
                        className={styles.releaseBtn}
                        onClick={() => promptRelease(selectedQuiz.id)}
                        disabled={!!releasing}
                      >
                        <BarChart3 size={16} style={{ marginRight: '6px' }} />
                        Release grades ({unreleasedCount})
                      </button>
                    ) : allReleased ? (
                      <span className={styles.releasedBanner}>
                        <CheckCircle size={14} /> Grades released
                      </span>
                    ) : (
                      <span className={styles.noSubsBanner}>
                        {selectedQuiz.isPublished
                          ? 'No submissions yet'
                          : 'Draft — not visible to students'}
                      </span>
                    )}
                  </div>

                  {analytics && (
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Average Score</p>
                        <p className={`${styles.statValue} ${getScoreColor(analytics.avg)}`}>{analytics.avg}%</p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Highest Score</p>
                        <p className={`${styles.statValue} ${styles.scoreHigh}`}>{analytics.highest}%</p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Lowest Score</p>
                        <p className={`${styles.statValue} ${getScoreColor(analytics.lowest)}`}>{analytics.lowest}%</p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Pass Rate (≥ 50%)</p>
                        <p className={`${styles.statValue} ${getScoreColor((analytics.passed / (analytics.total || 1)) * 100)}`}>
                          {Math.round((analytics.passed / (analytics.total || 1)) * 100)}%
                        </p>
                        <p className={styles.statSub}>{analytics.passed}/{analytics.total} passed</p>
                      </div>
                    </div>
                  )}

                  <div className={styles.submissionsSection}>
                    <h3 className={styles.submissionsSectionTitle}>
                      <Users size={18} style={{ marginRight: '6px' }} /> Student Submissions ({submissions.length})
                    </h3>

                    {submissionsLoading ? (
                      <SkeletonCard />
                    ) : submissions.length === 0 ? (
                      <div className={styles.emptySubmissions}>
                        <p>No students have submitted this quiz yet.</p>
                      </div>
                    ) : (
                      <div className={styles.submissionsTable}>
                        <div className={styles.tableHeader}>
                          <span>Student</span>
                          <span>Score</span>
                          <span>Percentage</span>
                          <span>Submitted Date</span>
                          <span>Status</span>
                        </div>
                        {submissions.map(submission => {
                          const percent = Math.round((submission.score / (submission.totalPoints || 1)) * 100)
                          return (
                            <div key={submission.id} className={styles.tableRow}>
                              <div className={styles.studentInfo}>
                                <div className={styles.studentAvatar}>
                                  {(submission.student?.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className={styles.studentName}>{submission.student?.name}</p>
                                  <p className={styles.studentEmail}>{submission.student?.email}</p>
                                </div>
                              </div>
                              <span className={styles.scoreRaw}>{submission.score}/{submission.totalPoints}</span>
                              <span className={`${styles.scorePercent} ${getScoreColor(percent)}`}>{percent}%</span>
                              <span className={styles.submittedAt}>{formatDate(submission.submittedAt)}</span>
                              <span className={`${styles.releasedStatus} ${submission.isReleased ? styles.released : styles.notReleased}`}>
                                {submission.isReleased ? (
                                  <><CheckCircle size={12} /> Released</>
                                ) : (
                                  <><Hourglass size={12} /> Awaiting release</>
                                )}
                              </span>
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

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, quizId: null })}
          onConfirm={handleReleaseResults}
          title="Release grades to students?"
          message={`Release grades for this quiz? ${unreleasedCount || 'All'} student${(unreleasedCount || 0) === 1 ? '' : 's'} will immediately see scores and answer breakdowns.`}
          confirmLabel="Release grades"
          confirmVariant="primary"
          loading={!!releasing}
        />
      </div>
    </DashboardLayout>
  )
}

export default TeacherAnalytics