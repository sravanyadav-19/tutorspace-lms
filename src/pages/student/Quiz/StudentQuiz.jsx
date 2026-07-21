import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, RefreshCw, Clock, Play, CheckCircle, BarChart3, AlertCircle, Search, Trophy, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './StudentQuiz.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const StudentQuiz = () => {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'available' | 'submitted'
  const [error, setError] = useState('')

  useEffect(() => { fetchQuizzes() }, [])

  useEffect(() => {
    let result = [...(quizzes || [])]

    if (activeTab === 'available') {
      result = result.filter(q => !q.submissions || q.submissions.length === 0)
    } else if (activeTab === 'submitted') {
      result = result.filter(q => q.submissions && q.submissions.length > 0)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(q =>
        q.title?.toLowerCase().includes(term) ||
        q.class?.name?.toLowerCase().includes(term) ||
        q.class?.subject?.toLowerCase().includes(term)
      )
    }

    setFilteredQuizzes(result)
  }, [quizzes, searchTerm, activeTab])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getStudentQuizzes()
      const list = res?.data?.data?.quizzes || []
      setQuizzes(list)
      setFilteredQuizzes(list)
    } catch (err) {
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const getQuizStatus = (quiz) => quiz.submissions && quiz.submissions.length > 0 ? 'submitted' : 'available'

  const availableCount = (quizzes || []).filter(q => !q.submissions || q.submissions.length === 0).length
  const submittedCount = (quizzes || []).filter(q => q.submissions && q.submissions.length > 0).length

  return (
    <DashboardLayout userRole="student">
      <div className={styles.quizPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <ClipboardList size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              My Quizzes & Assessments
            </h1>
            <p className={styles.pageSubtitle}>Take timed quizzes, submit answers, and review your graded results</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchQuizzes}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {/* Navigation Tabs Bar */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <ClipboardList size={16} /> All Quizzes ({(quizzes || []).length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'available' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <Play size={16} /> Ready to Take
            {availableCount > 0 && <span className={styles.availableBadgeCount}>{availableCount}</span>}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'submitted' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            <CheckCircle size={16} /> Already Submitted ({submittedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search quizzes by title, class, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={3} type="card" />
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState
            icon="quizzes"
            title={searchTerm || activeTab !== 'all' ? 'No Matching Quizzes' : 'No Quizzes Available'}
            message={searchTerm || activeTab !== 'all' ? 'Try adjusting your search filter or active tab' : "Your instructors haven't published any quizzes yet."}
          />
        ) : (
          <div className={styles.quizGrid}>
            {filteredQuizzes.map(quiz => {
              const status = getQuizStatus(quiz)
              const submission = quiz.submissions?.[0]

              return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizCardHeader}>
                    <div>
                      <h3 className={styles.quizTitle}>{quiz.title}</h3>
                      <p className={styles.quizClass}>{quiz.class?.name} • {quiz.class?.subject}</p>
                    </div>
                    <span className={`${styles.statusBadge} ${status === 'submitted' ? styles.submittedBadge : styles.availableBadge}`}>
                      {status === 'submitted' ? <><CheckCircle size={12} /> Submitted</> : <><Play size={12} /> Ready to Take</>}
                    </span>
                  </div>

                  {quiz.description && <p className={styles.quizDescription}>{quiz.description}</p>}

                  <div className={styles.quizMeta}>
                    <span className={styles.metaPill}>
                      <ClipboardList size={12} /> {quiz._count?.questions || 0} questions
                    </span>
                    {quiz.timeLimit && (
                      <span className={`${styles.metaPill} ${styles.timePill}`}>
                        <Clock size={12} /> {quiz.timeLimit} min limit
                      </span>
                    )}
                    <span className={styles.dateMeta}>Posted {formatDate(quiz.createdAt)}</span>
                  </div>

                  {submission && (
                    <div className={styles.submissionInfo}>
                      <p className={styles.submissionText}>
                        Submitted on {formatDate(submission.submittedAt)}
                      </p>
                      {submission.isReleased ? (
                        <p className={styles.resultsReleased}>
                          <Trophy size={14} style={{ marginRight: '4px' }} />
                          Graded Results & Answer Breakdown Released
                        </p>
                      ) : (
                        <p className={styles.pendingResults}>
                          <BarChart3 size={13} style={{ marginRight: '4px' }} />
                          Awaiting teacher grade release
                        </p>
                      )}
                    </div>
                  )}

                  <div className={styles.quizActions}>
                    {status === 'submitted' ? (
                      submission?.isReleased ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate('/student/results')}
                          className={styles.viewResultsBtn}
                        >
                          <Trophy size={14} style={{ marginRight: '4px' }} /> View Score & Answers <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                        </Button>
                      ) : (
                        <button className={`${styles.actionBtn} ${styles.disabledBtn}`} disabled>
                          <CheckCircle size={14} style={{ marginRight: '4px' }} /> Already Submitted
                        </button>
                      )
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}
                        className={styles.takeBtn}
                      >
                        <Play size={14} style={{ marginRight: '6px' }} /> Start Quiz Now
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