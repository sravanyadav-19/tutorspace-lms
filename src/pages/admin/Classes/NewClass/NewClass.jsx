import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import Input from '../../../../components/shared/Input'
import ConfirmModal from '../../../../components/shared/ConfirmModal'
import { classAPI } from '../../../../services/api'
import { useToast } from '../../../../context/ToastContext'
import { validateField } from '../../../../utils/validation'
import styles from './NewClass.module.css'
import { SkeletonCard } from '../../../../components/shared/Skeleton/Skeleton'

const NewClass = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const nameRef = useRef(null)

  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null })

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isValid, setIsValid] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    const newErrors = {}
    let valid = true
    const nameErr = validateField('name', name)
    const subjectErr = validateField('subject', subject)
    if (nameErr) { newErrors.name = nameErr; valid = false }
    if (subjectErr) { newErrors.subject = subjectErr; valid = false }
    setErrors(newErrors)
    setIsValid(valid)
  }, [name, subject])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await import('../../../../services/api')
      const { userAPI } = res
      const usersRes = await userAPI.getAllUsers()
      const allUsers = usersRes.data.data.users
      setTeachers(allUsers.filter(u => u.role?.name === 'teacher' && u.status === 'active'))
      setStudents(allUsers.filter(u => u.role?.name === 'student' && u.status === 'active'))
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target
    switch (fieldName) {
      case 'name': setName(value); break
      case 'subject': setSubject(value); break
      case 'description': setDescription(value); break
      default: break
    }
  }

  const handleBlur = (e) => {
    const { name: fieldName } = e.target
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }

  const toggleUser = (userId, listType) => {
    if (listType === 'teacher') {
      setSelectedTeachers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
    } else {
      setSelectedStudents(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
    }
  }

  const handleCreate = async (e) => {
    if (e) e.preventDefault()
    setTouched({ name: true, subject: true })
    if (!isValid) return

    setCreating(true)
    setError('')
    try {
      await classAPI.createClass({
        name,
        subject,
        description: description || undefined,
        teacherIds: selectedTeachers,
        studentIds: selectedStudents
      })
      toast.success(`Class "${name}" created successfully!`)
      navigate('/admin/classes')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create class'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.newClassPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📚 Create New Class</h1>
            <p className={styles.pageSubtitle}>Set up a new class and assign teachers and students</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/admin/classes')}>← Back to Classes</Button>
        </div>

        {error && <div className={styles.errorBanner} role="alert">⚠️ {error}</div>}

        {loading ? <SkeletonCard /> : (
          <form onSubmit={handleCreate} className={styles.form} noValidate>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>📋 Class Details</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Input label="Class Name" name="name" placeholder="e.g. Mathematics 101" value={name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : ''} required ref={nameRef} />
                </div>
                <div className={styles.formGroup}>
                  <Input label="Subject" name="subject" placeholder="e.g. Calculus" value={subject} onChange={handleChange} onBlur={handleBlur} error={touched.subject ? errors.subject : ''} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description (optional)</label>
                <textarea className={styles.textarea} placeholder="Brief description of the class..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>👨‍🏫 Assign Teachers</h2>
              {teachers.length === 0 ? (
                <p className={styles.emptyText}>No active teachers available. Create teacher accounts first.</p>
              ) : (
                <div className={styles.userGrid}>
                  {teachers.map(teacher => (
                    <div key={teacher.id} className={`${styles.userCard} ${selectedTeachers.includes(teacher.id) ? styles.userCardSelected : ''}`} onClick={() => toggleUser(teacher.id, 'teacher')}>
                      <div className={styles.userAvatar}>{teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={styles.userInfo}><p className={styles.userName}>{teacher.name}</p><p className={styles.userEmail}>{teacher.email}</p></div>
                      <span className={selectedTeachers.includes(teacher.id) ? styles.checkMark : styles.addMark}>{selectedTeachers.includes(teacher.id) ? '✓' : '+'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>🎓 Enroll Students</h2>
              {students.length === 0 ? (
                <p className={styles.emptyText}>No active students available. Students must register first.</p>
              ) : (
                <div className={styles.userGrid}>
                  {students.map(student => (
                    <div key={student.id} className={`${styles.userCard} ${selectedStudents.includes(student.id) ? styles.userCardSelected : ''}`} onClick={() => toggleUser(student.id, 'student')}>
                      <div className={styles.userAvatar}>{student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={styles.userInfo}><p className={styles.userName}>{student.name}</p><p className={styles.userEmail}>{student.email}</p></div>
                      <span className={selectedStudents.includes(student.id) ? styles.checkMark : styles.addMark}>{selectedStudents.includes(student.id) ? '✓' : '+'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => navigate('/admin/classes')}>Cancel</Button>
              <Button variant="primary" type="submit" loading={creating} disabled={creating || !isValid}>
                {creating ? 'Creating...' : '✅ Create Class'}
              </Button>
            </div>
          </form>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
          onConfirm={() => { confirmModal.onConfirm?.(); setConfirmModal({ open: false, message: '', onConfirm: null }) }}
          title="Confirm"
          message={confirmModal.message}
          confirmLabel="Continue"
          confirmVariant="primary"
        />
      </div>
    </DashboardLayout>
  )
}

export default NewClass