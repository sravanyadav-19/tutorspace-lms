import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './StudentResults.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'

const StudentResults = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchResults() }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getStudentResults()
      setSubmissions(res.data.data.submissions || [])
    } catch (err) {
      setError('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score, total) => {
    const percent = (score / total) * 100
    if (percent >= 80) return styles.scoreHigh
    if (percent >= 50) return styles.scoreMid
    return styles.scoreLow
  }

  const getScoreLabel = (score, total) => {
    const percent = (score / total) * 100
    if (percent >= 80) return '🏆 Excellent'
    if (percent >= 50) return '👍 Good'
    return '📚 Needs Work'
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.resultsPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📊 My Results</h1>
            <p className={styles.pageSubtitle}>
              View your released quiz results and answers
            </p>
          </div>
          <Button variant="secondary" onClick={fetchResults}>
            🔄 Refresh
          </Button>
        </div>

        {error && (
          <div className={styles.errorBanner}>⚠️ {error}</div>
        )}

        {loading ? (
          <SkeletonGrid count={3} type="card" />
        ) : submissions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3 className={styles.emptyTitle}>No Results Yet</h3>
            <p className={styles.emptyText}>
              Your teacher hasn't released any quiz results yet.
              Check back soon!
            </p>
          </div>
        ) : (
          <div className={styles.resultsList}>
            {submissions.map(submission => {
              const percent = Math.round(
                (submission.score / submission.totalPoints) * 100
              )
              const isExpanded = expandedId === submission.id

              return (
                <div key={submission.id} className={styles.resultCard}>

                  {/* Result Header */}
                  <div
                    className={styles.resultHeader}
                    onClick={() => toggleExpand(submission.id)}
                  >
                    <div className={styles.resultInfo}>
                      <h3 className={styles.quizTitle}>
                        {submission.quiz?.title}
                      </h3>
                      <p className={styles.quizClass}>
                        {submission.quiz?.class?.name} •{' '}
                        {submission.quiz?.class?.subject}
                      </p>
                      <p className={styles.submittedAt}>
                        Submitted: {formatDate(submission.submittedAt)}
                      </p>
                    </div>

                    <div className={styles.resultScore}>
                      <div className={`
                        ${styles.scoreCircle}
                        ${getScoreColor(submission.score, submission.totalPoints)}
                      `}>
                        <span className={styles.scorePercent}>{percent}%</span>
                        <span className={styles.scoreRaw}>
                          {submission.score}/{submission.totalPoints}
                        </span>
                      </div>
                      <p className={styles.scoreLabel}>
                        {getScoreLabel(submission.score, submission.totalPoints)}
                      </p>
                      <span className={styles.expandBtn}>
                        {isExpanded ? '▲ Hide' : '▼ Details'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Answer Review */}
                  {isExpanded && (
                    <div className={styles.answerReview}>
                      <h4 className={styles.reviewTitle}>📋 Answer Review</h4>
                      <div className={styles.answersList}>
                        {submission.answers?.map((answer, index) => (
                          <div
                            key={answer.id}
                            className={`
                              ${styles.answerItem}
                              ${answer.isCorrect
                                ? styles.answerCorrect
                                : styles.answerWrong}
                            `}
                          >
                            <div className={styles.answerHeader}>
                              <span className={styles.answerNumber}>
                                Q{index + 1}
                              </span>
                              <span className={styles.answerStatus}>
                                {answer.isCorrect ? '✅ Correct' : '❌ Wrong'}
                              </span>
                              <span className={styles.answerPoints}>
                                {answer.pointsEarned}/{answer.question?.points} pts
                              </span>
                            </div>

                            <p className={styles.answerQuestion}>
                              {answer.question?.questionText}
                            </p>

                            <div className={styles.answerComparison}>
                              <div className={styles.answerYours}>
                                <span className={styles.answerLabel}>
                                  Your answer:
                                </span>
                                <span className={`
                                  ${styles.answerValue}
                                  ${answer.isCorrect
                                    ? styles.correctValue
                                    : styles.wrongValue}
                                `}>
                                  {answer.studentAnswer}
                                </span>
                              </div>

                              {!answer.isCorrect && (
                                <div className={styles.answerCorrectAnswer}>
                                  <span className={styles.answerLabel}>
                                    Correct answer:
                                  </span>
                                  <span className={`
                                    ${styles.answerValue}
                                    ${styles.correctValue}
                                  `}>
                                    {answer.question?.correctAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentResults
