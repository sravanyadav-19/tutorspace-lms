import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { quizAPI } from '../../../services/api'
import styles from './TakeQuiz.module.css'

const TakeQuiz = () => {
  const navigate = useNavigate()
  const { quizId } = useParams()

  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { fetchQuiz() }, [quizId])

  const fetchQuiz = async () => {
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
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmitQuiz = async () => {
    if (!quiz) return

    const unanswered = quiz.questions.filter(
      q => !String(answers[q.id] || '').trim()
    )

    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting')
      return
    }

    if (!window.confirm(
      'Submit this quiz? You cannot change answers after submission.'
    )) return

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        answers: quiz.questions.map(q => ({
          questionId: q.id,
          studentAnswer: answers[q.id] || ''
        }))
      }
      await quizAPI.submitQuiz(quizId, payload)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.loadingState}>
          <p>Loading quiz...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (submitted) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.successState}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>Quiz Submitted!</h1>
          <p className={styles.successText}>
            Your answers have been submitted successfully.
            Results will be available when your teacher releases them.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/student/quizzes')}
          >
            ← Back to Quizzes
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !quiz) {
    return (
      <DashboardLayout userRole="student">
        <div className={styles.errorState}>
          <p>⚠️ {error}</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/student/quizzes')}
          >
            ← Go Back
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.takeQuizPage}>

        {/* Header */}
        <div className={styles.quizHeader}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/student/quizzes')}
          >
            ← Back to Quizzes
          </button>
          <div className={styles.quizTitleBlock}>
            <h1 className={styles.quizTitle}>{quiz?.title}</h1>
            <p className={styles.quizMeta}>
              {quiz?.class?.name} • {quiz?.class?.subject}
              {quiz?.timeLimit && ` • ⏱️ ${quiz.timeLimit} min`}
            </p>
            {quiz?.description && (
              <p className={styles.quizDescription}>{quiz.description}</p>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>⚠️ {error}</div>
        )}

        {/* Questions */}
        <div className={styles.questionsList}>
          {quiz?.questions?.map((question, index) => (
            <div key={question.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>
                  Question {index + 1}
                </span>
                <span className={styles.pointsBadge}>
                  {question.points} pt{question.points > 1 ? 's' : ''}
                </span>
              </div>

              <h3 className={styles.questionText}>
                {question.questionText}
              </h3>

              {question.options &&
              Array.isArray(question.options) &&
              question.options.length > 0 ? (
                <div className={styles.optionsList}>
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className={styles.optionItem}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(
                          question.id, e.target.value
                        )}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className={styles.answerTextarea}
                  placeholder="Type your answer here..."
                  rows={4}
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(
                    question.id, e.target.value
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit Footer */}
        <div className={styles.submitSection}>
          <div className={styles.progressText}>
            Answered{' '}
            {Object.keys(answers).filter(
              key => String(answers[key]).trim()
            ).length}
            {' / '}
            {quiz?.questions?.length || 0} questions
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? '⏳ Submitting...' : '✅ Submit Quiz'}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default TakeQuiz
