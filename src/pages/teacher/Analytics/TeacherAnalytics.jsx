import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI, quizAPI } from '../../../services/api'
import styles from './TeacherAnalytics.module.css'

const TeacherAnalytics = () => {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchClasses() }, [])

  useEffect(() => {
    if (selectedClass) fetchQuizzes(selectedClass.id)
  }, [selectedClass])

  useEffect(() => {
    if (selectedQuiz) fetchSubmissions(selectedQuiz.id)
  }, [selectedQuiz])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      const teacherClasses = res.data.data.classes
      setClasses(teacherClasses)
      if (teacherClasses.length > 0) setSelectedClass(teacherClasses[0])
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
      const classQuizzes = res.data.data.quizzes
      setQuizzes(classQuizzes)
      if (classQuizzes.length > 0) setSelectedQuiz(classQuizzes[0])
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
      setSubmissions(res.data.data.submissions || [])
    } catch (err) {
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const handleReleaseResults = async (quizId) => {
    if (!window.confirm('Release results to all students?')) return
    try {
      await quizAPI.releaseResults(quizId)
      setSuccess('Results released to all students!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to release results')
      setTimeout(() => setError(''), 3000)
    }
  }

  const getAnalytics = () => {
    if (!submissions.length) return null
    const scores = submissions.map(s =>
      Math.round((s.score / s.totalPoints) * 100)
    )
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)
    const passed = scores.filter(s => s >= 50).length
    return { avg, highest, lowest, passed, total: submissions.length }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getScoreColor = (percent) => {
    if (percent >= 80) return styles.scoreHigh
    if (percent >= 50) return styles.scoreMid
    return styles.scoreLow
  }

  const analytics = getAnalytics()

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.analyticsPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📊 Analytics</h1>
            <p className={styles.pageSubtitle}>
              View quiz performance and student submissions
            </p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}>
            🔄 Refresh
          </Button>
        </div>

        {success && <div className={styles.successBanner}>✅ {success}</div>}
        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        {loading ? (
          <div className={styles.loadingState}><p>Loading...</p></div>
        ) : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3>
            <p className={styles.emptyText}>
              You need to be assigned to a class first.
            </p>
          </div>
        ) : (
          <div className={styles.contentLayout}>

            {/* Left Sidebar: Classes + Quizzes */}
            <div className={styles.leftSidebar}>

              {/* Classes */}
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Classes</h3>
                <div className={styles.classList}>
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      className={`
                        ${styles.classItem}
                        ${selectedClass?.id === cls.id
                          ? styles.classItemActive : ''}
                      `}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <span>📚</span>
                      <div className={styles.classItemInfo}>
                        <p className={styles.classItemName}>{cls.name}</p>
                        <p className={styles.classItemSubject}>{cls.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quizzes */}
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Quizzes</h3>
                {quizzesLoading ? (
                  <p className={styles.sidebarLoading}>Loading...</p>
                ) : quizzes.length === 0 ? (
                  <p className={styles.sidebarEmpty}>No quizzes yet</p>
                ) : (
                  <div className={styles.quizList}>
                    {quizzes.map(quiz => (
                      <button
                        key={quiz.id}
                        className={`
                          ${styles.quizItem}
                          ${selectedQuiz?.id === quiz.id
                            ? styles.quizItemActive : ''}
                        `}
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        <p className={styles.quizItemTitle}>{quiz.title}</p>
                        <div className={styles.quizItemMeta}>
                          <span>{quiz._count?.submissions || 0} submissions</span>
                          <span className={`
                            ${styles.quizItemStatus}
                            ${quiz.isPublished
                              ? styles.publishedStatus
                              : styles.draftStatus}
                          `}>
                            {quiz.isPublished ? '🟢' : '⚪'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>

              {!selectedQuiz ? (
                <div className={styles.selectQuizPrompt}>
                  <div className={styles.emptyIcon}>📝</div>
                  <h3 className={styles.emptyTitle}>Select a Quiz</h3>
                  <p className={styles.emptyText}>
                    Choose a quiz from the left to view analytics
                  </p>
                </div>
              ) : (
                <>
                  {/* Quiz Header */}
                  <div className={styles.quizAnalyticsHeader}>
                    <div>
                      <h2 className={styles.quizAnalyticsTitle}>
                        {selectedQuiz.title}
                      </h2>
                      <p className={styles.quizAnalyticsMeta}>
                        {selectedClass?.name} •{' '}
                        {selectedQuiz._count?.questions || 0} questions •{' '}
                        {submissions.length} submissions
                      </p>
                    </div>
                    <button
                      className={styles.releaseBtn}
                      onClick={() => handleReleaseResults(selectedQuiz.id)}
                    >
                      📊 Release Results
                    </button>
                  </div>

                  {/* Analytics Stats */}
                  {analytics && (
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Average Score</p>
                        <p className={`${styles.statValue} ${getScoreColor(analytics.avg)}`}>
                          {analytics.avg}%
                        </p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Highest Score</p>
                        <p className={`${styles.statValue} ${styles.scoreHigh}`}>
                          {analytics.highest}%
                        </p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Lowest Score</p>
                        <p className={`${styles.statValue} ${getScoreColor(analytics.lowest)}`}>
                          {analytics.lowest}%
                        </p>
                      </div>
                      <div className={styles.statCard}>
                        <p className={styles.statLabel}>Pass Rate</p>
                        <p className={`${styles.statValue} ${getScoreColor((analytics.passed / analytics.total) * 100)}`}>
                          {Math.round((analytics.passed / analytics.total) * 100)}%
                        </p>
                        <p className={styles.statSub}>
                          {analytics.passed}/{analytics.total} passed
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submissions Table */}
                  <div className={styles.submissionsSection}>
                    <h3 className={styles.submissionsSectionTitle}>
                      👥 Student Submissions
                    </h3>

                    {submissionsLoading ? (
                      <div className={styles.loadingState}>
                        <p>Loading submissions...</p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className={styles.emptySubmissions}>
                        <p>No submissions yet for this quiz.</p>
                      </div>
                    ) : (
                      <div className={styles.submissionsTable}>
                        <div className={styles.tableHeader}>
                          <span>Student</span>
                          <span>Score</span>
                          <span>Percentage</span>
                          <span>Submitted</span>
                          <span>Status</span>
                        </div>
                        {submissions.map(submission => {
                          const percent = Math.round(
                            (submission.score / submission.totalPoints) * 100
                          )
                          return (
                            <div
                              key={submission.id}
                              className={styles.tableRow}
                            >
                              <div className={styles.studentInfo}>
                                <div className={styles.studentAvatar}>
                                  {submission.student?.name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <p className={styles.studentName}>
                                    {submission.student?.name}
                                  </p>
                                  <p className={styles.studentEmail}>
                                    {submission.student?.email}
                                  </p>
                                </div>
                              </div>
                              <span className={styles.scoreRaw}>
                                {submission.score}/{submission.totalPoints}
                              </span>
                              <span className={`
                                ${styles.scorePercent}
                                ${getScoreColor(percent)}
                              `}>
                                {percent}%
                              </span>
                              <span className={styles.submittedAt}>
                                {formatDate(submission.submittedAt)}
                              </span>
                              <span className={`
                                ${styles.releasedStatus}
                                ${submission.isReleased
                                  ? styles.released
                                  : styles.notReleased}
                              `}>
                                {submission.isReleased
                                  ? '✅ Released'
                                  : '⏳ Pending'}
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
      </div>
    </DashboardLayout>
  )
}

export default TeacherAnalytics
