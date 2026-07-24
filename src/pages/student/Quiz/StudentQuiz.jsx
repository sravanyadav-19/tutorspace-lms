import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ClipboardList,
  RefreshCw,
  Clock,
  Play,
  CheckCircle,
  Hourglass,
  AlertCircle,
  Search,
  Trophy,
  ArrowRight
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import {
  QUIZ_STATUS,
  STATUS_LABELS,
  countByStatus,
  getStudentQuizStatus,
  getSubmission
} from '../../../utils/studentQuiz'
import styles from './StudentQuiz.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const TAB_FROM_QUERY = {
  ready: 'ready',
  available: 'ready',
  awaiting: 'awaiting',
  submitted: 'awaiting',
  graded: 'graded',
  results: 'graded',
  all: 'all'
}

const StudentQuiz = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = TAB_FROM_QUERY[searchParams.get('tab')] || 'all'

  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuizzes()
  }, [])

  // Keep URL ?tab= in sync for deep links from dashboard
  useEffect(() => {
    const q = searchParams.get('tab')
    const mapped = TAB_FROM_QUERY[q]
    if (mapped && mapped !== activeTab) {
      setActiveTab(mapped)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const setTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'all') {
      searchParams.delete('tab')
    } else {
      searchParams.set('tab', tab)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getStudentQuizzes()
      const list = res?.data?.data?.quizzes || []
      setQuizzes(list)
    } catch (err) {
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => countByStatus(quizzes), [quizzes])

  const filteredQuizzes = useMemo(() => {
    let result = [...(quizzes || [])]

    if (activeTab === 'ready') {
      result = result.filter((q) => getStudentQuizStatus(q) === QUIZ_STATUS.READY)
    } else if (activeTab === 'awaiting') {
      result = result.filter(
        (q) => getStudentQuizStatus(q) === QUIZ_STATUS.AWAITING_RELEASE
      )
    } else if (activeTab === 'graded') {
      result = result.filter((q) => getStudentQuizStatus(q) === QUIZ_STATUS.GRADED)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(
        (q) =>
          q.title?.toLowerCase().includes(term) ||
          q.class?.name?.toLowerCase().includes(term) ||
          q.class?.subject?.toLowerCase().includes(term)
      )
    }

    return result
  }, [quizzes, searchTerm, activeTab])

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  const statusBadgeClass = (status) => {
    switch (status) {
      case QUIZ_STATUS.READY:
        return styles.availableBadge
      case QUIZ_STATUS.AWAITING_RELEASE:
        return styles.awaitingBadge
      case QUIZ_STATUS.GRADED:
        return styles.gradedBadge
      default:
        return styles.submittedBadge
    }
  }

  const StatusIcon = ({ status }) => {
    if (status === QUIZ_STATUS.READY) return <Play size={12} />
    if (status === QUIZ_STATUS.AWAITING_RELEASE) return <Hourglass size={12} />
    return <Trophy size={12} />
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.quizPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <ClipboardList
                size={22}
                style={{ marginRight: '8px', verticalAlign: 'middle' }}
              />
              My quizzes
            </h1>
            <p className={styles.pageSubtitle}>
              Take quizzes, track submissions, and open graded results when released
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchQuizzes}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}
          </div>
        )}

        {/* Summary strip */}
        {!loading && counts.total > 0 && (
          <div className={styles.summaryStrip} aria-label="Quiz summary">
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{counts.ready}</span>
              <span className={styles.summaryLabel}>Ready to take</span>
            </div>
            <div className={styles.summaryDivider} aria-hidden="true" />
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{counts.awaitingRelease}</span>
              <span className={styles.summaryLabel}>Awaiting release</span>
            </div>
            <div className={styles.summaryDivider} aria-hidden="true" />
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{counts.graded}</span>
              <span className={styles.summaryLabel}>Graded</span>
            </div>
          </div>
        )}

        <div className={styles.tabsContainer} role="tablist" aria-label="Quiz filters">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setTab('all')}
          >
            <ClipboardList size={16} /> All ({counts.total})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ready'}
            className={`${styles.tabBtn} ${activeTab === 'ready' ? styles.tabActive : ''}`}
            onClick={() => setTab('ready')}
          >
            <Play size={16} /> Ready to take
            {counts.ready > 0 && (
              <span className={styles.availableBadgeCount}>{counts.ready}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'awaiting'}
            className={`${styles.tabBtn} ${activeTab === 'awaiting' ? styles.tabActive : ''}`}
            onClick={() => setTab('awaiting')}
          >
            <Hourglass size={16} /> Awaiting release ({counts.awaitingRelease})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'graded'}
            className={`${styles.tabBtn} ${activeTab === 'graded' ? styles.tabActive : ''}`}
            onClick={() => setTab('graded')}
          >
            <Trophy size={16} /> Graded ({counts.graded})
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, class, or subject…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              aria-label="Search quizzes"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={3} type="card" />
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState
            icon="quizzes"
            title={
              searchTerm || activeTab !== 'all'
                ? 'No matching quizzes'
                : 'No quizzes yet'
            }
            message={
              searchTerm || activeTab !== 'all'
                ? 'Try another tab or clear your search.'
                : "Your instructors haven't published any quizzes yet."
            }
          />
        ) : (
          <div className={styles.quizGrid}>
            {filteredQuizzes.map((quiz) => {
              const status = getStudentQuizStatus(quiz)
              const submission = getSubmission(quiz)

              return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizCardHeader}>
                    <div>
                      <h3 className={styles.quizTitle}>{quiz.title}</h3>
                      <p className={styles.quizClass}>
                        {quiz.class?.name} • {quiz.class?.subject}
                      </p>
                    </div>
                    <span className={`${styles.statusBadge} ${statusBadgeClass(status)}`}>
                      <StatusIcon status={status} />
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className={styles.quizDescription}>{quiz.description}</p>
                  )}

                  <div className={styles.quizMeta}>
                    <span className={styles.metaPill}>
                      <ClipboardList size={12} /> {quiz._count?.questions || 0}{' '}
                      questions
                    </span>
                    {quiz.timeLimit && (
                      <span className={`${styles.metaPill} ${styles.timePill}`}>
                        <Clock size={12} /> {quiz.timeLimit} min limit
                      </span>
                    )}
                    <span className={styles.dateMeta}>
                      Posted {formatDate(quiz.createdAt)}
                    </span>
                  </div>

                  {submission && (
                    <div
                      className={`${styles.submissionInfo} ${
                        status === QUIZ_STATUS.GRADED
                          ? styles.submissionGraded
                          : styles.submissionAwaiting
                      }`}
                    >
                      <p className={styles.submissionText}>
                        Submitted {formatDate(submission.submittedAt)}
                      </p>
                      {status === QUIZ_STATUS.GRADED ? (
                        <p className={styles.resultsReleased}>
                          <Trophy size={14} style={{ marginRight: '4px' }} />
                          Results released
                          {submission.score != null && submission.totalPoints != null && (
                            <span className={styles.scoreInline}>
                              {' '}
                              · {submission.score}/{submission.totalPoints}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className={styles.pendingResults}>
                          <Hourglass size={13} style={{ marginRight: '4px' }} />
                          Awaiting teacher grade release
                        </p>
                      )}
                    </div>
                  )}

                  <div className={styles.quizActions}>
                    {status === QUIZ_STATUS.READY && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}
                        className={styles.takeBtn}
                      >
                        <Play size={14} style={{ marginRight: '6px' }} /> Start quiz
                      </Button>
                    )}

                    {status === QUIZ_STATUS.AWAITING_RELEASE && (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.disabledBtn}`}
                        disabled
                      >
                        <CheckCircle size={14} style={{ marginRight: '4px' }} />
                        Submitted — waiting for release
                      </button>
                    )}

                    {status === QUIZ_STATUS.GRADED && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/student/results')}
                        className={styles.viewResultsBtn}
                      >
                        <Trophy size={14} style={{ marginRight: '4px' }} />
                        View score & answers
                        <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                      </Button>
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
