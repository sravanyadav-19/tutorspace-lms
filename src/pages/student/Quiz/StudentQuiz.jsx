import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, RefreshCw, Clock, Play, CheckCircle, BarChart3, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './StudentQuiz.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const StudentQuiz = () => {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchQuizzes() }, [])

  const fetchQuizzes = async () => {
    try { setLoading(true); setError(''); const res = await quizAPI.getStudentQuizzes(); setQuizzes(res.data.data.quizzes || []) }
    catch (err) { setError('Failed to load quizzes') }
    finally { setLoading(false) }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const getQuizStatus = (quiz) => quiz.submissions && quiz.submissions.length > 0 ? 'submitted' : 'available'

  return (
    <DashboardLayout userRole="student">
      <div className={styles.quizPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><ClipboardList size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> My Quizzes</h1>
            <p className={styles.pageSubtitle}>View and take quizzes from your enrolled classes</p>
          </div>
          <Button variant="secondary" onClick={fetchQuizzes}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonGrid count={3} type="card" /> : quizzes.length === 0 ? (
          <EmptyState
            icon="quizzes"
            title="No Quizzes Available"
            message="Your teachers haven't published any quizzes yet."
          />
        ) : (
          <div className={styles.quizGrid}>
            {quizzes.map(quiz => {
              const status = getQuizStatus(quiz)
              const submission = quiz.submissions?.[0]
              return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizCardHeader}>
                    <div><h3 className={styles.quizTitle}>{quiz.title}</h3><p className={styles.quizClass}>{quiz.class?.name} • {quiz.class?.subject}</p></div>
                    <span className={`${styles.statusBadge} ${status === 'submitted' ? styles.submittedBadge : styles.availableBadge}`}>
                      {status === 'submitted' ? <><CheckCircle size={12} /> Submitted</> : <><Play size={12} /> Available</>}
                    </span>
                  </div>
                  {quiz.description && <p className={styles.quizDescription}>{quiz.description}</p>}
                  <div className={styles.quizMeta}>
                    <span><ClipboardList size={12} /> {quiz._count?.questions || 0} questions</span>
                    {quiz.timeLimit && <><span>•</span><span><Clock size={12} /> {quiz.timeLimit} min</span></>}
                    <span>•</span><span>{formatDate(quiz.createdAt)}</span>
                  </div>
                  {submission && (
                    <div className={styles.submissionInfo}>
                      <p className={styles.submissionText}>Submitted on {formatDate(submission.submittedAt)}</p>
                      {submission.isReleased && <p className={styles.resultsReleased}><BarChart3 size={12} /> Results have been released</p>}
                    </div>
                  )}
                  <div className={styles.quizActions}>
                    {status === 'submitted' ? (
                      <button className={`${styles.actionBtn} ${styles.disabledBtn}`} disabled><CheckCircle size={14} style={{ marginRight: '4px' }} /> Already Submitted</button>
                    ) : (
                      <button className={`${styles.actionBtn} ${styles.takeBtn}`} onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}><Play size={14} style={{ marginRight: '4px' }} /> Take Quiz</button>
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