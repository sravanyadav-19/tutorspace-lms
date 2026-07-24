import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ListChecks
} from 'lucide-react'
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
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [timeLeft, setTimeLeft] = useState(null)
  const [timerWarning, setTimerWarning] = useState(false)

  // Refs avoid stale closures in timer / double-submit races
  const answersRef = useRef({})
  const quizRef = useRef(null)
  const submittedRef = useRef(false)
  const submittingRef = useRef(false)
  const timerIdRef = useRef(null)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    quizRef.current = quiz
  }, [quiz])

  useEffect(() => {
    submittedRef.current = submitted
  }, [submitted])

  const clearTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }
  }

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await quizAPI.getQuizForStudent(quizId)
      setQuiz(res.data.data.quiz)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    fetchQuiz()
    return () => clearTimer()
  }, [fetchQuiz])

  // Warn if user tries to leave mid-quiz
  useEffect(() => {
    if (!quiz || submitted) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [quiz, submitted])

  const buildPayload = useCallback(() => {
    const q = quizRef.current
    const ans = answersRef.current
    if (!q?.questions) return { answers: [] }
    return {
      answers: q.questions.map((question) => ({
        questionId: question.id,
        studentAnswer: String(ans[question.id] ?? '').trim()
      }))
    }
  }, [])

  const submitQuiz = useCallback(
    async ({ isAuto = false } = {}) => {
      if (submittedRef.current || submittingRef.current) return
      if (!quizRef.current) return

      submittingRef.current = true
      setSubmitting(true)
      setError('')
      clearTimer()

      try {
        await quizAPI.submitQuiz(quizId, buildPayload())
        submittedRef.current = true
        setSubmitted(true)
        setAutoSubmitted(isAuto)
        setConfirmOpen(false)
        if (isAuto) {
          toast.warning('Time is up — your quiz was submitted automatically.')
        } else {
          toast.success('Quiz submitted successfully!')
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          (isAuto ? 'Auto-submission failed. Try Submit again.' : 'Failed to submit quiz')
        setError(msg)
        toast.error(msg)
        // Allow retry if submit failed
        submittingRef.current = false
      } finally {
        setSubmitting(false)
      }
    },
    [quizId, buildPayload, toast]
  )

  // Start countdown once quiz with timeLimit is loaded
  useEffect(() => {
    if (!quiz?.timeLimit || submitted) return undefined

    const totalSeconds = quiz.timeLimit * 60
    setTimeLeft(totalSeconds)
    setTimerWarning(false)

    clearTimer()
    timerIdRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev
        if (prev <= 1) {
          clearTimer()
          // Fire auto-submit outside setState
          queueMicrotask(() => submitQuiz({ isAuto: true }))
          return 0
        }
        const next = prev - 1
        if (next <= 60) setTimerWarning(true)
        return next
      })
    }, 1000)

    return () => clearTimer()
  }, [quiz?.id, quiz?.timeLimit, submitted, submitQuiz])

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (error) setError('')
  }

  const questionStats = useMemo(() => {
    const total = quiz?.questions?.length || 0
    const answered = (quiz?.questions || []).filter((q) =>
      String(answers[q.id] ?? '').trim()
    ).length
    const unansweredIds = (quiz?.questions || [])
      .filter((q) => !String(answers[q.id] ?? '').trim())
      .map((q) => q.id)
    return { total, answered, unanswered: total - answered, unansweredIds }
  }, [quiz, answers])

  const openConfirm = () => {
    setError('')
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = () => {
    submitQuiz({ isAuto: false })
  }

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return ''
    const s = Math.max(0, seconds)
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }

  const scrollToQuestion = (questionId) => {
    const el = document.getElementById(`question-${questionId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const confirmMessage =
    questionStats.unanswered > 0
      ? `You still have ${questionStats.unanswered} unanswered question${
          questionStats.unanswered === 1 ? '' : 's'
        }. Submit anyway? You cannot change answers after submitting.`
      : `Submit ${questionStats.answered} of ${questionStats.total} answered? You cannot change answers after submitting.`

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.loadingWrap}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    )
  }

  if (submitted) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.successState}>
          <div className={styles.successIconWrap}>
            <CheckCircle size={40} color="#5db872" aria-hidden="true" />
          </div>
          <h1 className={styles.successTitle}>
            {autoSubmitted ? 'Time’s up — quiz submitted' : 'Quiz submitted'}
          </h1>
          <p className={styles.successText}>
            {autoSubmitted
              ? 'Your answers were saved automatically when the timer ended.'
              : 'Your answers are saved.'}{' '}
            Scores and answer reviews appear after your teacher releases results.
          </p>
          <div className={styles.successActions}>
            <Button variant="secondary" onClick={() => navigate('/student/quizzes')}>
              <ArrowLeft size={16} style={{ marginRight: '6px' }} />
              Back to quizzes
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/student/quizzes?tab=awaiting')}
            >
              View submitted
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !quiz) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.errorState} role="alert">
          <AlertCircle size={28} color="#c64545" />
          <p>{error}</p>
          <Button variant="secondary" onClick={() => navigate('/student/quizzes')}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Back to quizzes
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const timerDanger = timeLeft !== null && timeLeft <= 30
  const progressPct =
    questionStats.total > 0
      ? Math.round((questionStats.answered / questionStats.total) * 100)
      : 0

  return (
    <DashboardLayout userRole="student">
      <div className={styles.takeQuizPage}>
        {/* Sticky top bar: back + timer */}
        <div className={styles.stickyBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              if (
                questionStats.answered > 0 &&
                !window.confirm(
                  'Leave this quiz? Your answers are not submitted until you press Submit.'
                )
              ) {
                return
              }
              navigate('/student/quizzes')
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Exit</span>
          </button>

          <div className={styles.stickyCenter}>
            <span className={styles.stickyTitle}>{quiz?.title}</span>
            <span className={styles.stickyProgress}>
              {questionStats.answered}/{questionStats.total} answered
            </span>
          </div>

          {timeLeft !== null ? (
            <div
              className={`${styles.timerBox} ${timerWarning ? styles.timerWarning : ''} ${
                timerDanger ? styles.timerDanger : ''
              }`}
              role="timer"
              aria-live="polite"
              aria-label={`Time remaining ${formatTime(timeLeft)}`}
            >
              <Clock size={16} aria-hidden="true" />
              <span className={styles.timerText}>{formatTime(timeLeft)}</span>
              {timerWarning && (
                <span className={styles.timerLabel}>
                  {timerDanger ? 'Hurry!' : '< 1 min'}
                </span>
              )}
            </div>
          ) : (
            <div className={styles.noTimerBadge}>No time limit</div>
          )}
        </div>

        <header className={styles.quizHeader}>
          <p className={styles.quizMeta}>
            {quiz?.class?.name}
            {quiz?.class?.subject ? ` · ${quiz.class.subject}` : ''}
            {quiz?.timeLimit ? ` · ${quiz.timeLimit} min limit` : ''}
          </p>
          <h1 className={styles.quizTitle}>{quiz?.title}</h1>
          {quiz?.description && (
            <p className={styles.quizDescription}>{quiz.description}</p>
          )}
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Question navigator */}
        {questionStats.total > 1 && (
          <nav className={styles.navigator} aria-label="Question navigator">
            <div className={styles.navigatorLabel}>
              <ListChecks size={14} aria-hidden="true" />
              Jump to question
            </div>
            <div className={styles.navigatorDots}>
              {(quiz?.questions || []).map((q, index) => {
                const done = String(answers[q.id] ?? '').trim()
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`${styles.navDot} ${done ? styles.navDotDone : ''}`}
                    onClick={() => scrollToQuestion(q.id)}
                    aria-label={`Question ${index + 1}${done ? ', answered' : ', unanswered'}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </nav>
        )}

        <div className={styles.questionsList}>
          {(quiz?.questions || []).map((question, index) => {
            const selected = answers[question.id]
            const isAnswered = Boolean(String(selected ?? '').trim())
            const options = Array.isArray(question.options) ? question.options : []

            return (
              <div
                key={question.id}
                id={`question-${question.id}`}
                className={`${styles.questionCard} ${
                  isAnswered ? styles.questionAnswered : ''
                }`}
              >
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>
                    Question {index + 1}
                    <span className={styles.questionOf}>
                      {' '}
                      of {questionStats.total}
                    </span>
                  </span>
                  <div className={styles.questionHeaderRight}>
                    {isAnswered && (
                      <span className={styles.answeredBadge}>
                        <CheckCircle size={10} aria-hidden="true" /> Answered
                      </span>
                    )}
                    <span className={styles.pointsBadge}>
                      {question.points} pt{question.points > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <h2 className={styles.questionText}>{question.questionText}</h2>

                {options.length > 0 ? (
                  <div
                    className={styles.optionsList}
                    role="radiogroup"
                    aria-label={`Options for question ${index + 1}`}
                  >
                    {options.map((option, optIndex) => {
                      const checked = selected === option
                      return (
                        <label
                          key={optIndex}
                          className={`${styles.optionItem} ${
                            checked ? styles.optionSelected : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={checked}
                            onChange={(e) =>
                              handleAnswerChange(question.id, e.target.value)
                            }
                          />
                          <span className={styles.optionLetter} aria-hidden="true">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className={styles.optionText}>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <textarea
                    className={styles.answerTextarea}
                    placeholder="Type your answer…"
                    rows={4}
                    value={selected || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    aria-label={`Answer for question ${index + 1}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Sticky submit footer */}
        <div className={styles.submitSection}>
          <div className={styles.submitLeft}>
            <div className={styles.progressBar} aria-hidden="true">
              <div
                className={styles.progressFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {questionStats.answered} of {questionStats.total} answered
              {questionStats.unanswered > 0 && (
                <button
                  type="button"
                  className={styles.jumpUnanswered}
                  onClick={() => {
                    const first = questionStats.unansweredIds[0]
                    if (first) scrollToQuestion(first)
                  }}
                >
                  · Jump to unanswered
                </button>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={openConfirm}
            loading={submitting}
            disabled={submitting || questionStats.total === 0}
            className={styles.submitBtn}
          >
            {submitting ? (
              'Submitting…'
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>Submit quiz</span>
              </>
            )}
          </Button>
        </div>

        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => !submitting && setConfirmOpen(false)}
          onConfirm={handleConfirmSubmit}
          title={
            questionStats.unanswered > 0
              ? 'Submit with unanswered questions?'
              : 'Submit quiz?'
          }
          message={confirmMessage}
          confirmLabel={submitting ? 'Submitting…' : 'Yes, submit'}
          confirmVariant={questionStats.unanswered > 0 ? 'danger' : 'primary'}
          loading={submitting}
        />
      </div>
    </DashboardLayout>
  )
}

export default TakeQuiz
