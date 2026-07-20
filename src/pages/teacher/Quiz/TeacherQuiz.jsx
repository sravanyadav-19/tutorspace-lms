import React, { useState, useEffect } from 'react'
import { BookOpen, PlusCircle, Pencil, Trash2, Play, Pause, BarChart3, ClipboardList, Clock, AlertCircle, X, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { classAPI, quizAPI } from '../../../services/api'
import styles from './TeacherQuiz.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import { validateField } from '../../../utils/validation'
import EmptyState from '../../../components/shared/EmptyState'

const TeacherQuiz = () => {
  const toast = useToast()

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [questions, setQuestions] = useState([{ questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }])
  const [creating, setCreating] = useState(false)
  const [quizErrors, setQuizErrors] = useState({})
  const [quizTouched, setQuizTouched] = useState({})
  const [quizFormValid, setQuizFormValid] = useState(false)

  const [deleteModal, setDeleteModal] = useState({ open: false, quizId: null, title: '' })
  const [releaseModal, setReleaseModal] = useState({ open: false, quizId: null, title: '' })
  const [deleting, setDeleting] = useState(null)
  const [releasing, setReleasing] = useState(null)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass?.id) fetchQuizzes(selectedClass.id) }, [selectedClass])

  useEffect(() => {
    const errors = {}; let valid = true
    const titleErr = validateField('quizTitle', quizTitle)
    if (titleErr) { errors.title = titleErr; valid = false }
    const questionErrors = []
    ;(questions || []).forEach((q) => {
      const qErrors = {}
      const textErr = validateField('questionText', q?.questionText)
      const ansErr = validateField('correctAnswer', q?.correctAnswer)
      if (textErr) { qErrors.questionText = textErr; valid = false }
      if (ansErr) { qErrors.correctAnswer = ansErr; valid = false }
      const opts = Array.isArray(q?.options) ? q.options : []
      const filledOptions = opts.filter((o) => typeof o === 'string' && o.trim() !== '')
      if (filledOptions.length < 2) { qErrors.options = 'At least 2 options required'; valid = false }
      questionErrors.push(qErrors)
    })
    if (questionErrors.some((e) => Object.keys(e).length > 0)) errors.questions = questionErrors
    setQuizErrors(errors); setQuizFormValid(valid)
  }, [quizTitle, questions])

  const fetchClasses = async () => {
    try { setLoading(true); const res = await classAPI.getTeacherClasses(); const tc = res?.data?.data?.classes || []; setClasses(tc); if (tc.length > 0) setSelectedClass(tc[0]) }
    catch (err) { setError('Failed to load classes') }
    finally { setLoading(false) }
  }

  const fetchQuizzes = async (classId) => {
    try { setQuizzesLoading(true); const res = await quizAPI.getClassQuizzes(classId); setQuizzes(res?.data?.data?.quizzes || []) }
    catch (err) { setQuizzes([]) }
    finally { setQuizzesLoading(false) }
  }

  const addQuestion = () => setQuestions(prev => [...(prev || []), { questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }])
  const removeQuestion = (index) => { if ((questions || []).length <= 1) return; setQuestions(prev => (prev || []).filter((_, i) => i !== index)) }
  const updateQuestion = (index, field, value) => setQuestions(prev => (prev || []).map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  const updateOption = (qIndex, optIndex, value) => setQuestions(prev => (prev || []).map((q, i) => { if (i !== qIndex) return q; const newOptions = Array.isArray(q.options) ? [...q.options] : ['', '', '', '']; newOptions[optIndex] = value; return { ...q, options: newOptions } }))

  const getQuestionError = (qIndex, field) => { if (!quizTouched.questions?.[qIndex]?.[field]) return ''; return quizErrors.questions?.[qIndex]?.[field] || '' }
  const touchQuestionField = (qIndex, field) => setQuizTouched(prev => { const qs = prev.questions ? [...prev.questions] : []; if (!qs[qIndex]) qs[qIndex] = {}; qs[qIndex] = { ...qs[qIndex], [field]: true }; return { ...prev, questions: qs } })
  const touchQuizField = (field) => setQuizTouched(prev => ({ ...prev, [field]: true }))

  const handleCreateQuiz = async () => {
    const touchedQuestions = (questions || []).map(() => ({ questionText: true, correctAnswer: true, options: true }))
    setQuizTouched({ title: true, questions: touchedQuestions })
    if (!quizFormValid || !selectedClass?.id) return
    setCreating(true); setError('')
    try {
      const quizData = {
        title: quizTitle,
        description: quizDescription,
        classId: selectedClass.id,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        questions: (questions || []).map((q) => ({
          questionText: q?.questionText || '',
          questionType: q?.questionType || 'multiple_choice',
          options: (Array.isArray(q?.options) ? q.options : []).filter((o) => typeof o === 'string' && o.trim() !== ''),
          correctAnswer: q?.correctAnswer || '',
          points: parseInt(q?.points) || 1
        }))
      }
      const res = await quizAPI.createQuiz(quizData)
      const createdQuiz = res?.data?.data?.quiz
      if (createdQuiz) {
        setQuizzes(prev => [createdQuiz, ...(prev || [])])
      }
      toast.success('Quiz created successfully!')
      setShowCreateForm(false); setQuizTitle(''); setQuizDescription(''); setTimeLimit('')
      setQuestions([{ questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]); setQuizTouched({})
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to create quiz') }
    finally { setCreating(false) }
  }

  const handleTogglePublish = async (quizId, isPublished) => {
    try { await quizAPI.togglePublish(quizId); setQuizzes(prev => (prev || []).map((q) => q.id === quizId ? { ...q, isPublished: !isPublished } : q)); toast.success(isPublished ? 'Quiz unpublished' : 'Quiz published!') }
    catch (err) { toast.error('Failed to update quiz') }
  }

  const promptDelete = (quizId, title) => setDeleteModal({ open: true, quizId, title })
  const promptRelease = (quizId, title) => setReleaseModal({ open: true, quizId, title })

  const handleDeleteQuiz = async () => {
    const { quizId } = deleteModal; if (!quizId) return
    setDeleting(quizId)
    try { await quizAPI.deleteQuiz(quizId); setQuizzes(prev => (prev || []).filter((q) => q.id !== quizId)); toast.success('Quiz deleted successfully') }
    catch (err) { toast.error('Failed to delete quiz') }
    finally { setDeleting(null); setDeleteModal({ open: false, quizId: null, title: '' }) }
  }

  const handleReleaseResults = async () => {
    const { quizId } = releaseModal; if (!quizId) return
    setReleasing(quizId)
    try { await quizAPI.releaseResults(quizId); toast.success('Results released to students!') }
    catch (err) { toast.error('Failed to release results') }
    finally { setReleasing(null); setReleaseModal({ open: false, quizId: null, title: '' }) }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.quizPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><ClipboardList size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Quizzes</h1>
            <p className={styles.pageSubtitle}>Create and manage quizzes for your classes</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? <><X size={16} style={{ marginRight: '6px' }} /> Cancel</> : <><PlusCircle size={16} style={{ marginRight: '6px' }} /> Create Quiz</>}</Button>
        </div>
        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : (classes || []).length === 0 ? (
          <EmptyState
            icon="classes"
            title="No Classes Assigned"
            message="You need to be assigned to a class first."
          />
        ) : (
          <div className={styles.contentLayout}>
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {(classes || []).map(cls => (
                  <button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`} onClick={() => { setSelectedClass(cls); setShowCreateForm(false) }}>
                    <BookOpen size={16} />
                    <div className={styles.classItemInfo}><p className={styles.classItemName}>{cls.name}</p><p className={styles.classItemSubject}>{cls.subject}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.mainContent}>
              {showCreateForm && (
                <div className={styles.createForm}>
                  <h2 className={styles.formTitle}><Pencil size={18} style={{ marginRight: '6px' }} /> New Quiz for {selectedClass?.name}</h2>
                  <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>Quiz Details</h3>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Quiz Title *</label><input type="text" className={`${styles.formInput} ${quizTouched.title && quizErrors.title ? styles.inputError : ''}`} placeholder="e.g. Chapter 5 Quiz, Midterm Test..." value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} onBlur={() => touchQuizField('title')} />{quizTouched.title && quizErrors.title && <span className={styles.inlineError} role="alert">{quizErrors.title}</span>}</div>
                    <div className={styles.formGroup}><label className={styles.formLabel}>Description (optional)</label><textarea className={styles.formTextarea} placeholder="Instructions for students..." value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} rows={3} /></div>
                    <div className={styles.formGroup}><label className={styles.formLabel}><Clock size={14} style={{ marginRight: '4px' }} /> Time Limit (minutes, optional)</label><input type="number" className={styles.formInput} placeholder="e.g. 30" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min="1" max="300" style={{ maxWidth: '200px' }} /></div>
                  </div>
                  <div className={styles.formSection}>
                    <div className={styles.questionsHeader}><h3 className={styles.formSectionTitle}>Questions ({(questions || []).length})</h3><button className={styles.addQuestionBtn} onClick={addQuestion}><PlusCircle size={14} style={{ marginRight: '4px' }} /> Add Question</button></div>
                    <div className={styles.questionsList}>
                      {(questions || []).map((q, qIndex) => (
                        <div key={qIndex} className={styles.questionCard}>
                          <div className={styles.questionHeader}><span className={styles.questionNumber}>Q{qIndex + 1}</span><div className={styles.questionControls}><input type="number" className={styles.pointsInput} value={q?.points || 1} onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)} min="1" max="100" /><span className={styles.pointsLabel}>pts</span>{(questions || []).length > 1 && <button className={styles.removeQuestionBtn} onClick={() => removeQuestion(qIndex)}><X size={14} /></button>}</div></div>
                          <div className={styles.formGroup}><label className={styles.formLabel}>Question *</label><textarea className={`${styles.formTextarea} ${getQuestionError(qIndex, 'questionText') ? styles.inputError : ''}`} placeholder="Enter your question here..." value={q?.questionText || ''} onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)} onBlur={() => touchQuestionField(qIndex, 'questionText')} rows={2} />{getQuestionError(qIndex, 'questionText') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'questionText')}</span>}</div>
                          <div className={styles.formGroup}><label className={styles.formLabel}>Answer Options</label><div className={styles.optionsList}>{(Array.isArray(q?.options) ? q.options : []).map((opt, optIndex) => (<div key={optIndex} className={styles.optionRow}><span className={styles.optionLabel}>{String.fromCharCode(65 + optIndex)}.</span><input type="text" className={styles.optionInput} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} value={opt || ''} onChange={(e) => updateOption(qIndex, optIndex, e.target.value)} /></div>))}</div>{getQuestionError(qIndex, 'options') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'options')}</span>}</div>
                          <div className={styles.formGroup}><label className={styles.formLabel}><CheckCircle size={14} style={{ marginRight: '4px' }} /> Correct Answer *</label><input type="text" className={`${styles.formInput} ${getQuestionError(qIndex, 'correctAnswer') ? styles.inputError : ''} ${styles.correctAnswerInput}`} placeholder="Type the exact correct answer..." value={q?.correctAnswer || ''} onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)} onBlur={() => touchQuestionField(qIndex, 'correctAnswer')} />{getQuestionError(qIndex, 'correctAnswer') && <span className={styles.inlineError} role="alert">{getQuestionError(qIndex, 'correctAnswer')}</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <Button variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateQuiz} loading={creating} disabled={creating || !quizFormValid}>{creating ? 'Creating...' : <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Create Quiz</>}</Button>
                  </div>
                </div>
              )}
              <div className={styles.quizzesList}>
                <div className={styles.quizzesHeader}><h2 className={styles.sectionTitle}><ClipboardList size={18} style={{ marginRight: '6px' }} /> {selectedClass?.name} Quizzes</h2><span className={styles.quizCount}>{(quizzes || []).length} quizzes</span></div>
                {quizzesLoading ? <SkeletonGrid count={3} type="card" /> : (quizzes || []).length === 0 ? (
                  <EmptyState
                    icon="quizzes"
                    title="No Quizzes Yet"
                    message='Click "Create Quiz" to add your first quiz.'
                    size="sm"
                  />
                ) : (
                  <div className={styles.quizCards}>
                    {(quizzes || []).map(quiz => (
                      <div key={quiz.id} className={styles.quizCard}>
                        <div className={styles.quizInfo}>
                          <div className={styles.quizTitleRow}><h3 className={styles.quizTitle}>{quiz.title}</h3><span className={`${styles.publishBadge} ${quiz.isPublished ? styles.publishedBadge : styles.draftBadge}`}>{quiz.isPublished ? <><Play size={10} /> Published</> : <><Pause size={10} /> Draft</>}</span></div>
                          <div className={styles.quizMeta}>
                            <span><ClipboardList size={12} /> {quiz._count?.questions || quiz.questions?.length || 0} questions</span><span>•</span>
                            <span><BarChart3 size={12} /> {quiz._count?.submissions || 0} submissions</span>
                            {quiz.timeLimit && <><span>•</span><span><Clock size={12} /> {quiz.timeLimit} min</span></>}
                            <span>•</span><span>{formatDate(quiz.createdAt)}</span>
                          </div>
                        </div>
                        <div className={styles.quizActions}>
                          <button className={`${styles.actionBtn} ${quiz.isPublished ? styles.unpublishBtn : styles.publishBtn}`} onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}>{quiz.isPublished ? <><Pause size={14} style={{ marginRight: '4px' }} /> Unpublish</> : <><Play size={14} style={{ marginRight: '4px' }} /> Publish</>}</button>
                          <button className={`${styles.actionBtn} ${styles.resultsBtn}`} onClick={() => promptRelease(quiz.id, quiz.title)}><BarChart3 size={14} style={{ marginRight: '4px' }} /> Release Results</button>
                          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => promptDelete(quiz.id, quiz.title)}><Trash2 size={14} style={{ marginRight: '4px' }} /> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, quizId: null, title: '' })} onConfirm={handleDeleteQuiz} title="Delete Quiz" message={`Delete "${deleteModal.title}"? All questions, submissions, and results will be permanently removed.`} confirmLabel="Delete Quiz" confirmVariant="danger" loading={!!deleting} />
        <ConfirmModal isOpen={releaseModal.open} onClose={() => setReleaseModal({ open: false, quizId: null, title: '' })} onConfirm={handleReleaseResults} title="Release Quiz Results" message={`Release results for "${releaseModal.title}"? All students who submitted will see their scores and answer reviews.`} confirmLabel="Release Results" confirmVariant="primary" loading={!!releasing} />
      </div>
    </DashboardLayout>
  )
}

export default TeacherQuiz