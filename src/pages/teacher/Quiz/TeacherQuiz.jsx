import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI, quizAPI } from '../../../services/api'
import styles from './TeacherQuiz.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import { validateField } from '../../../utils/validation'

const TeacherQuiz = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [questions, setQuestions] = useState([{
    questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1
  }])
  const [creating, setCreating] = useState(false)

  const [quizErrors, setQuizErrors] = useState({})
  const [quizTouched, setQuizTouched] = useState({})
  const [quizFormValid, setQuizFormValid] = useState(false)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass) fetchQuizzes(selectedClass.id) }, [selectedClass])

  useEffect(() => {
    const errors = {}
    let valid = true
    const titleErr = validateField('quizTitle', quizTitle)
    if (titleErr) { errors.title = titleErr; valid = false }
    const questionErrors = []
    questions.forEach((q, i) => {
      const qErrors = {}
      const textErr = validateField('questionText', q.questionText)
      const ansErr = validateField('correctAnswer', q.correctAnswer)
      if (textErr) { qErrors.questionText = textErr; valid = false }
      if (ansErr) { qErrors.correctAnswer = ansErr; valid = false }
      const filledOptions = q.options.filter((o) => o.trim() !== '')
      if (filledOptions.length < 2) { qErrors.options = 'At least 2 answer options are required'; valid = false }
      questionErrors.push(qErrors)
    })
    if (questionErrors.some((e) => Object.keys(e).length > 0)) errors.questions = questionErrors
    setQuizErrors(errors)
    setQuizFormValid(valid)
  }, [quizTitle, questions])

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
      const res = await quizAPI.getClassQuizzes(classId)
      setQuizzes(res.data.data.quizzes)
    } catch (err) {
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }])
  }

  const removeQuestion = (index) => {
    if (questions.length === 1) return
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const newOptions = [...q.options]
      newOptions[optIndex] = value
      return { ...q, options: newOptions }
    }))
  }

  const getQuestionError = (qIndex, field) => {
    if (!quizTouched.questions?.[qIndex]?.[field]) return ''
    return quizErrors.questions?.[qIndex]?.[field] || ''
  }

  const touchQuestionField = (qIndex, field) => {
    setQuizTouched(prev => {
      const questions = prev.questions ? [...prev.questions] : []
      if (!questions[qIndex]) questions[qIndex] = {}
      questions[qIndex] = { ...questions[qIndex], [field]: true }
      return { ...prev, questions }
    })
  }

  const touchQuizField = (field) => {
    setQuizTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleCreateQuiz = async () => {
    const touchedQuestions = questions.map(() => ({ questionText: true, correctAnswer: true, options: true }))
    setQuizTouched({ title: true, questions: touchedQuestions })
    if (!quizFormValid) return
    setCreating(true)
    setError('')
    try {
      const quizData = {
        title: quizTitle, description: quizDescription, classId: selectedClass.id,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        questions: questions.map((q) => ({
          questionText: q.questionText, questionType: q.questionType,
          options: q.options.filter((o) => o.trim() !== ''),
          correctAnswer: q.correctAnswer, points: parseInt(q.points) || 1
        }))
      }
      const res = await quizAPI.createQuiz(quizData)
      const newQuiz = res.data.data.quiz
      setQuizzes(prev => [newQuiz, ...prev])
      toast.success('Quiz created successfully!')
      setShowCreateForm(false)
      setQuizTitle('')
      setQuizDescription('')
      setTimeLimit('')
      setQuestions([{ questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }])
      setQuizTouched({})
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create quiz'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleTogglePublish = async (quizId, isPublished) => {
    try {
      await quizAPI.togglePublish(quizId)
      setQuizzes(prev => prev.map((q) => q.id === quizId ? { ...q, isPublished: !isPublished } : q))
      toast.success(isPublished ? 'Quiz unpublished' : 'Quiz published!')
    } catch (err) {
      toast.error('Failed to update quiz')
    }
  }

  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await quizAPI.deleteQuiz(quizId)
      setQuizzes(prev => prev.filter((q) => q.id !== quizId))
      toast.success('Quiz deleted successfully')
    } catch (err) {
      toast.error('Failed to delete quiz')
    }
  }

  const handleReleaseResults = async (quizId) => {
    if (!window.confirm('Release results to all students?')) return
    try {
      await quizAPI.releaseResults(quizId)
      toast.success('Results released to students!')
    } catch (err) {
      toast.error('Failed to release results')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.quizPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📝 Quiz Management</h1>
            <p className={styles.pageSubtitle}>Create and manage quizzes for your classes</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? 'Cancel' : '+ Create Quiz'}</Button>
        </div>
        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
        {success && <div className={styles.successBanner}>✅ {success}</div>}
        {loading ? <SkeletonCard /> : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><PageIcon name="book" size={64} /></div>
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3>
            <p className={styles.emptyText}>You need to be assigned to a class first.</p>
          </div>
        ) : (
          <div className={styles.contentLayout}>
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {classes.map(cls => (
                  <button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`} onClick={() => { setSelectedClass(cls); setShowCreateForm(false) }}>
                    <span className={styles.classItemIcon}><PageIcon name="book" size={18} /></span>
                    <div className={styles.classItemInfo}>
                      <p className={styles.classItemName}>{cls.name}</p>
                      <p className={styles.classItemSubject}>{cls.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.mainContent}>
              {showCreateForm && (
                <div className={styles.createForm}>
                  <h2 className={styles.formTitle}>✏️ New Quiz for {selectedClass?.name}</h2>
                  <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>Quiz Details</h3>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Quiz Title *</label>
                      <input type="text" className={`${styles.formInput} ${quizTouched.title && quizErrors.title ? styles.inputError : ''}`} placeholder="e.g. Chapter 5 Quiz, Midterm Test..." value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} onBlur={() => touchQuizField('title')} />
                      {quizTouched.title && quizErrors.title && <span className={styles.inlineError} role="alert">{quizErrors.title}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Description (optional)</label>
                      <textarea className={styles.formTextarea} placeholder="Instructions for students..." value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} rows={3} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>⏱️ Time Limit (minutes, optional)</label>
                      <input type="number" className={styles.formInput} placeholder="e.g. 30" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min="1" max="300" style={{ maxWidth: '200px' }} />
                    </div>
                  </div>
                  <div className={styles.formSection}>
                    <div className={styles.questionsHeader}>
                      <h3 className={styles.formSectionTitle}>Questions ({questions.length})</h3>
                      <button className={styles.addQuestionBtn} onClick={addQuestion}>+ Add Question</button>
                    </div>
                    <div className={styles.questionsList}>
                      {questions.map((q, qIndex) => (
                        <div key={qIndex} className={styles.questionCard}>
                          <div className={styles.questionHeader}>
                            <span className={styles.questionNumber}>Q{qIndex + 1}</span>
                            <div className={styles.questionControls}>
                              <input type="number" className={styles.pointsInput} value={q.points} onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)} min="1" max="100" />
                              <span className={styles.pointsLabel}>pts</span>
                              {questions.length > 1 && <button className={styles.removeQuestionBtn} onClick={() => removeQuestion(qIndex)}>✕</button>}
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Question *</label>
                            <textarea className={`${styles.formTextarea} ${getQuestionError(qIndex, 'questionText') ? styles.inputError : ''}`} placeholder="Enter your question here..." value={q.questionText} onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)} onBlur={() => touchQuestionField(qIndex, 'questionText')} rows={2} />
                            {getQuestionError(qIndex, 'questionText') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'questionText')}</span>}
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Answer Options</label>
                            <div className={styles.optionsList}>
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className={styles.optionRow}>
                                  <span className={styles.optionLabel}>{String.fromCharCode(65 + optIndex)}.</span>
                                  <input type="text" className={styles.optionInput} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} value={opt} onChange={(e) => updateOption(qIndex, optIndex, e.target.value)} />
                                </div>
                              ))}
                            </div>
                            {getQuestionError(qIndex, 'options') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'options')}</span>}
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>✅ Correct Answer *</label>
                            <input type="text" className={`${styles.formInput} ${getQuestionError(qIndex, 'correctAnswer') ? styles.inputError : ''} ${styles.correctAnswerInput}`} placeholder="Type the exact correct answer..." value={q.correctAnswer} onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)} onBlur={() => touchQuestionField(qIndex, 'correctAnswer')} />
                            {getQuestionError(qIndex, 'correctAnswer') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'correctAnswer')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <Button variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateQuiz} disabled={creating || !quizFormValid}>{creating ? 'Creating...' : 'Create Quiz'}</Button>
                  </div>
                </div>
              )}
              <div className={styles.quizzesList}>
                <div className={styles.quizzesHeader}>
                  <h2 className={styles.sectionTitle}>📝 {selectedClass?.name} Quizzes</h2>
                  <span className={styles.quizCount}>{quizzes.length} quizzes</span>
                </div>
                {quizzesLoading ? <SkeletonGrid count={3} type="card" /> : quizzes.length === 0 ? (
                  <div className={styles.emptyQuizzes}>
                    <div className={styles.emptyIcon}><PageIcon name="clipboard" size={64} /></div>
                    <h3 className={styles.emptyTitle}>No Quizzes Yet</h3>
                    <p className={styles.emptyText}>Click "Create Quiz" to add your first quiz.</p>
                  </div>
                ) : (
                  <div className={styles.quizCards}>
                    {quizzes.map(quiz => (
                      <div key={quiz.id} className={styles.quizCard}>
                        <div className={styles.quizInfo}>
                          <div className={styles.quizTitleRow}>
                            <h3 className={styles.quizTitle}>{quiz.title}</h3>
                            <span className={`${styles.publishBadge} ${quiz.isPublished ? styles.publishedBadge : styles.draftBadge}`}>{quiz.isPublished ? 'Published' : 'Draft'}</span>
                          </div>
                          <div className={styles.quizMeta}>
                            <span>❓ {quiz._count?.questions || 0} questions</span>
                            <span>•</span>
                            <span>👥 {quiz._count?.submissions || 0} submissions</span>
                            {quiz.timeLimit && <><span>•</span><span>⏱️ {quiz.timeLimit} min</span></>}
                            <span>•</span>
                            <span>{formatDate(quiz.createdAt)}</span>
                          </div>
                        </div>
                        <div className={styles.quizActions}>
                          <button className={`${styles.actionBtn} ${quiz.isPublished ? styles.unpublishBtn : styles.publishBtn}`} onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}>{quiz.isPublished ? 'Unpublish' : 'Publish'}</button>
                          <button className={`${styles.actionBtn} ${styles.resultsBtn}`} onClick={() => handleReleaseResults(quiz.id)}>Release Results</button>
                          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}><PageIcon name="delete" /> Delete/button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TeacherQuiz
