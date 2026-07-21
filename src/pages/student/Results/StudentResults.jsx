import React, { useState, useEffect } from 'react'
import { Trophy, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, ClipboardList, Search, Award, BarChart3, Star } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './StudentResults.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const StudentResults = () => {
  const [submissions, setSubmissions] = useState([])
  const [filteredSubmissions, setFilteredSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setStatusFilter] = useState('all') // 'all' | 'high' | 'low'

  useEffect(() => { fetchResults() }, [])

  useEffect(() => {
    let result = [...(submissions || [])]

    if (gradeFilter === 'high') {
      result = result.filter(s => (s.score / (s.totalPoints || 1)) * 100 >= 80)
    } else if (gradeFilter === 'low') {
      result = result.filter(s => (s.score / (s.totalPoints || 1)) * 100 < 50)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(s =>
        s.quiz?.title?.toLowerCase().includes(term) ||
        s.quiz?.class?.name?.toLowerCase().includes(term) ||
        s.quiz?.class?.subject?.toLowerCase().includes(term)
      )
    }

    setFilteredSubmissions(result)
  }, [submissions, searchTerm, gradeFilter])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getStudentResults()
      const list = res?.data?.data?.submissions || []
      setSubmissions(list)
      setFilteredSubmissions(list)
    } catch (err) {
      setError('Failed to load graded quiz results')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getScoreColor = (score, total) => {
    const percent = (score / (total || 1)) * 100
    if (percent >= 80) return styles.scoreHigh
    if (percent >= 50) return styles.scoreMid
    return styles.scoreLow
  }

  const getScoreLabel = (score, total) => {
    const percent = (score / (total || 1)) * 100
    if (percent >= 80) return <><Trophy size={13} style={{ marginRight: '3px' }} /> Excellent</>
    if (percent >= 50) return <>Good Progress</>
    return <>Needs Review</>
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  // Calculate overall performance summary
  const getOverallStats = () => {
    if (!submissions.length) return null
    const totalPossible = submissions.reduce((sum, s) => sum + (s.totalPoints || 0), 0)
    const totalEarned = submissions.reduce((sum, s) => sum + (s.score || 0), 0)
    const avgPercent = Math.round((totalEarned / (totalPossible || 1)) * 100)
    return { count: submissions.length, avgPercent, totalEarned, totalPossible }
  }

  const statsSummary = getOverallStats()

  return (
    <DashboardLayout userRole="student">
      <div className={styles.resultsPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <Trophy size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              My Performance & Graded Results
            </h1>
            <p className={styles.pageSubtitle}>Review released quiz scores, point breakdowns, and correct answer explanations</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchResults}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {/* Overall Summary Stats Bar */}
        {statsSummary && (
          <div className={styles.summaryBar}>
            <div className={styles.summaryCard}>
              <Award size={20} color="#cc785c" />
              <div>
                <p className={styles.summaryValue}>{statsSummary.count}</p>
                <p className={styles.summaryLabel}>Graded Assessments</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <BarChart3 size={20} color="#2e7d32" />
              <div>
                <p className={styles.summaryValue}>{statsSummary.avgPercent}%</p>
                <p className={styles.summaryLabel}>Average Score</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <Star size={20} color="#d97706" />
              <div>
                <p className={styles.summaryValue}>{statsSummary.totalEarned}/{statsSummary.totalPossible}</p>
                <p className={styles.summaryLabel}>Total Points Earned</p>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Tabs & Search */}
        {(submissions || []).length > 0 && (
          <div className={styles.toolbar}>
            <div className={styles.filterTabs}>
              <button
                className={`${styles.tabBtn} ${gradeFilter === 'all' ? styles.tabActive : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Results ({submissions.length})
              </button>
              <button
                className={`${styles.tabBtn} ${gradeFilter === 'high' ? styles.tabActive : ''}`}
                onClick={() => setStatusFilter('high')}
              >
                🌟 High Scores (≥80%)
              </button>
              <button
                className={`${styles.tabBtn} ${gradeFilter === 'low' ? styles.tabActive : ''}`}
                onClick={() => setStatusFilter('low')}
              >
                ⚠️ Needs Work (&lt;50%)
              </button>
            </div>

            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Filter results by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={3} type="card" />
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            icon="results"
            title={searchTerm || gradeFilter !== 'all' ? 'No Matching Results' : 'No Results Released Yet'}
            message={searchTerm || gradeFilter !== 'all' ? 'Try adjusting your search terms or filter tab' : "Your teacher hasn't released any quiz results yet. Check back soon!"}
          />
        ) : (
          <div className={styles.resultsList}>
            {filteredSubmissions.map(submission => {
              const percent = Math.round((submission.score / (submission.totalPoints || 1)) * 100)
              const isExpanded = expandedId === submission.id

              return (
                <div key={submission.id} className={styles.resultCard}>
                  <div className={styles.resultHeader} onClick={() => toggleExpand(submission.id)}>
                    <div className={styles.resultInfo}>
                      <h3 className={styles.quizTitle}>{submission.quiz?.title}</h3>
                      <p className={styles.quizClass}>{submission.quiz?.class?.name} • {submission.quiz?.class?.subject}</p>
                      <p className={styles.submittedAt}>Submitted: {formatDate(submission.submittedAt)}</p>
                    </div>

                    <div className={styles.resultScore}>
                      <div className={`${styles.scoreCircle} ${getScoreColor(submission.score, submission.totalPoints)}`}>
                        <span className={styles.scorePercent}>{percent}%</span>
                        <span className={styles.scoreRaw}>{submission.score}/{submission.totalPoints}</span>
                      </div>
                      <p className={styles.scoreLabel}>{getScoreLabel(submission.score, submission.totalPoints)}</p>
                      <span className={styles.expandBtn}>
                        {isExpanded ? <><ChevronUp size={12} /> Hide Review</> : <><ChevronDown size={12} /> Review Answers</>}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Answer Review Section */}
                  {isExpanded && (
                    <div className={styles.answerReview}>
                      <h4 className={styles.reviewTitle}>
                        <ClipboardList size={16} style={{ marginRight: '6px' }} /> Question Breakdown & Answers
                      </h4>

                      <div className={styles.answersList}>
                        {submission.answers?.map((answer, index) => (
                          <div
                            key={answer.id}
                            className={`${styles.answerItem} ${answer.isCorrect ? styles.answerCorrect : styles.answerWrong}`}
                          >
                            <div className={styles.answerHeader}>
                              <span className={styles.answerNumber}>Question {index + 1}</span>
                              <span className={styles.answerStatus}>
                                {answer.isCorrect ? (
                                  <><CheckCircle size={13} color="#2e7d32" style={{ marginRight: '4px' }} /> Correct</>
                                ) : (
                                  <><XCircle size={13} color="#c64545" style={{ marginRight: '4px' }} /> Incorrect</>
                                )}
                              </span>
                              <span className={styles.answerPoints}>{answer.pointsEarned}/{answer.question?.points} pt(s)</span>
                            </div>

                            <p className={styles.answerQuestion}>{answer.question?.questionText}</p>

                            <div className={styles.answerComparison}>
                              <div className={styles.answerYours}>
                                <span className={styles.answerLabel}>Your Choice:</span>
                                <span className={`${styles.answerValue} ${answer.isCorrect ? styles.correctValue : styles.wrongValue}`}>
                                  {answer.studentAnswer || '(No answer provided)'}
                                </span>
                              </div>

                              {!answer.isCorrect && (
                                <div className={styles.answerCorrectAnswer}>
                                  <span className={styles.answerLabel}>Correct Answer:</span>
                                  <span className={`${styles.answerValue} ${styles.correctValue}`}>
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