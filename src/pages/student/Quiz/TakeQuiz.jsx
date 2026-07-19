import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { quizAPI } from '../../../services/api'
import { useToast } from '../../../context/ToastContext'
import styles from './TakeQuiz.module.css'
import { SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'

const TakeQuiz = () => {
  const navigate = useNavigate()
  const { quizId } = useParams()
  const toast = useToast()

  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)

  const [timeLeft, setTimeLeft] = useState(null)
  const [timerWarning, setTimerWarning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => { fetchQuiz() }, [quizId])
  useEffect(() => { if (quiz?.timeLimit && !submitted) setTimeLeft(quiz.timeLimit * 60) }, [quiz])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { handleAutoSubmit(); return }
    if (timeLeft <= 60) setTimerWarning(true)
    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft])

  const fetchQuiz = async () => {
    try { setLoading(true); setError(''); const res = await quizAPI.getQuizForStudent(quizId); setQuiz(res.data.data.quiz) }
    catch (err) { setError(err.response?.data?.message || 'Failed to load quiz') }
    finally { setLoading(false) }
  }

  const handleAnswerChange = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }))

  const handleAutoSubmit = async () => {
    clearTimeout(timerRef.current)
    if (!quiz || submitted) return          // ← GUARD: skip if already submitted
    setSubmitting(true)
    try { const payload = { answers: quiz.questions.map(q => ({ questionId: q.id, studentAnswer: answers[q.id] || '' })) }; await quizAPI.submitQuiz(quizId, payload); setSubmitted(true); toast.warning('Time is up! Your quiz has been auto-submitted.') }
    catch (err) { setError('Auto-submission failed.') }
    finally { setSubmitting(false) }
  }

  const handleSubmitQuiz = async () => {
    if (!quiz) return
    const unanswered = quiz.questions.filter(q => !String(answers[q.id] || '').trim())
    if (unanswered.length > 0) { setError('Please answer all questions before submitting'); return }
    clearTimeout(timerRef.current); setSubmitting(true); setError('')
    try { const payload = { answers: quiz.questions.map(q => ({ questionId: q.id, studentAnswer: answers[q.id] || '' })) }; await quizAPI.submitQuiz(quizId, payload); setSubmitted(true); setConfirmModal(false) }
    catch (err) { setError(err.response?.data?.message || 'Failed to submit quiz') }
    finally { setSubmitting(false) }
  }

  const formatTime = (seconds) => {
    if (seconds === null) return ''
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).filter(key => String(answers[key]).trim()).length

  if (loading) {
    return (<DashboardLayout userRole="student"><div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></DashboardLayout>)
  }

  if (submitted) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.successState}>
          <CheckCircle size={48} color="#5db872" style={{ marginBottom: '16px' }} />
          <h1 className={styles.successTitle}>Quiz Submitted!</h1>
          <p className={styles.successText}>Results will be available when your teacher releases them.</p>
          <Button variant="primary" onClick={() => navigate('/student/quizzes')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Quizzes</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !quiz) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.errorState} role="alert"><p><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</p><Button variant="secondary" onClick={() => navigate('/student/quizzes')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Go Back</Button></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.takeQuizPage}>
        <div className={styles.quizHeader}>
          <div className={styles.quizHeaderTop}>
            <button className={styles.backBtn} onClick={() => navigate('/student/quizzes')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Quizzes</button>
            {timeLeft !== null && (
              <div className={`${styles.timerBox} ${timerWarning ? styles.timerWarning : ''} ${timeLeft <= 30 ? styles.timerDanger : ''}`}>
                <Clock size={16} /><span className={styles.timerText}>{formatTime(timeLeft)}</span>
                {timerWarning && <span className={styles.timerLabel}>Less than 1 min!</span>}
              </div>
            )}
          </div>
          <div className={styles.quizTitleBlock}>
            <h1 className={styles.quizTitle}>{quiz?.title}</h1>
            <p className={styles.quizMeta}>{quiz?.class?.name} • {quiz?.class?.subject}{quiz?.timeLimit && ` • <Clock size={12} /> ${quiz.timeLimit} min limit`}</p>
            {quiz?.description && <p className={styles.quizDescription}>{quiz.description}</p>}
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        <div className={styles.questionsList}>
          {quiz?.questions?.map((question, index) => (
            <div key={question.id} className={`${styles.questionCard} ${answers[question.id] ? styles.questionAnswered : ''}`}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {index + 1}</span>
                <div className={styles.questionHeaderRight}>
                  {answers[question.id] && <span className={styles.answeredBadge}><CheckCircle size={10} /> Answered</span>}
                  <span className={styles.pointsBadge}>{question.points} pt{question.points > 1 ? 's' : ''}</span>
                </div>
              </div>
              <h3 className={styles.questionText}>{question.questionText}</h3>
              {question.options && Array.isArray(question.options) && question.options.length > 0 ? (
                <div className={styles.optionsList}>
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className={`${styles.optionItem} ${answers[question.id] === option ? styles.optionSelected : ''}`}>
                      <input type="radio" name={`question-${question.id}`} value={option} checked={answers[question.id] === option} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea className={styles.answerTextarea} placeholder="Type your answer here..." rows={4} value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
              )}
            </div>
          ))}
        </div>

        <div className={styles.submitSection}>
          <div className={styles.submitLeft}>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(answeredCount / (quiz?.questions?.length || 1)) * 100}%` }} /></div>
            <p className={styles.progressText}>{answeredCount} / {quiz?.questions?.length || 0} questions answered</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setConfirmModal(true)} loading={submitting} disabled={submitting}>{submitting ? 'Submitting...' : <><CheckCircle size={16} style={{ marginRight: '6px' }} /> Submit Quiz</>}</Button>
        </div>

        <ConfirmModal isOpen={confirmModal} onClose={() => setConfirmModal(false)} onConfirm={handleSubmitQuiz} title="Submit Quiz" message="Are you sure you want to submit? You cannot change your answers after submission." confirmLabel="Submit Quiz" confirmVariant="primary" loading={submitting} />
      </div>
    </DashboardLayout>
  )
}

export default TakeQuiz