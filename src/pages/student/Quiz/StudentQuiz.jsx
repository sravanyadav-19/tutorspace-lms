import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './StudentQuiz.module.css'

const StudentQuiz = () => {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchQuizzes() }, [])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getStudentQuizzes()
      setQuizzes(res.data.data.quizzes || [])
    } catch (err) {
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getQuizStatus = (quiz) => {
    if (quiz.submissions && quiz.submissions.length > 0) return 'submitted'
    return 'available'
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.quizPage}>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📝 My Quizzes</h1>
            <p className={styles.pageSubtitle}>
              View and take quizzes from your enrolled classes
            </p>
          </div>
          <Button variant="secondary" onClick={fetchQuizzes}>
            🔄 Refresh
          </Button>
        </div>

        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        {loading ? (
          <div className={styles.loadingState}><p>Loading quizzes...</p></div>
        ) : quizzes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3 className={styles.emptyTitle}>No Quizzes Available</h3>
            <p className={styles.emptyText}>
              Your teachers haven't published any quizzes yet.
            </p>
          </div>
        ) : (
          <div className={styles.quizGrid}>
            {quizzes.map(quiz => {
              const status = getQuizStatus(quiz)
              const submission = quiz.submissions?.[0]
              return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizCardHeader}>
                    <div>
                      <h3 className={styles.quizTitle}>{quiz.title}</h3>
                      <p className={styles.quizClass}>
                        {quiz.class?.name} • {quiz.class?.subject}
                      </p>
                    </div>
                    <span className={`
                      ${styles.statusBadge}
                      ${status === 'submitted'
                        ? styles.submittedBadge
                        : styles.availableBadge}
                    `}>
                      {status === 'submitted' ? '✅ Submitted' : '🟢 Available'}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className={styles.quizDescription}>{quiz.description}</p>
                  )}

                  <div className={styles.quizMeta}>
                    <span>❓ {quiz._count?.questions || 0} questions</span>
                    {quiz.timeLimit && (
                      <><span>•</span><span>⏱️ {quiz.timeLimit} min</span></>
                    )}
                    <span>•</span>
                    <span>📅 {formatDate(quiz.createdAt)}</span>
                  </div>

                  {submission && (
                    <div className={styles.submissionInfo}>
                      <p className={styles.submissionText}>
                        Submitted on {formatDate(submission.submittedAt)}
                      </p>
                      {submission.isReleased && (
                        <p className={styles.resultsReleased}>
                          📊 Results have been released
                        </p>
                      )}
                    </div>
                  )}

                  <div className={styles.quizActions}>
                    {status === 'submitted' ? (
                      <button
                        className={`${styles.actionBtn} ${styles.disabledBtn}`}
                        disabled
                      >
                        ✅ Already Submitted
                      </button>
                    ) : (
                      <button
                        className={`${styles.actionBtn} ${styles.takeBtn}`}
                        onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}
                      >
                        ▶ Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentQuiz
