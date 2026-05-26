import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import Input from '../../../../components/shared/Input'
import { Textarea } from '../../../../components/shared/Input'
import { classAPI, userAPI } from '../../../../services/api'
import { useToast } from '../../../../context/ToastContext'
import { validateField } from '../../../../utils/validation'
import styles from './NewClass.module.css'

const NewClass = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [formData, setFormData] = useState({ name: '', subject: '', description: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isValid, setIsValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [students, setStudents] = useState([])
  const [createdClassId, setCreatedClassId] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    const newErrors = {}
    let valid = true
    const nameErr = validateField('className', formData.name)
    const subjErr = validateField('subject', formData.subject)
    if (nameErr) { newErrors.name = nameErr; valid = false }
    if (subjErr) { newErrors.subject = subjErr; valid = false }
    setErrors(newErrors)
    setIsValid(valid)
  }, [formData])

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers()
      const allUsers = res.data.data.users
      setTeachers(allUsers.filter((u) => u.role.name === 'teacher'))
      setStudents(allUsers.filter((u) => u.role.name === 'student'))
    } catch (err) {
      console.error('Failed to fetch users')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const toggleTeacher = (teacherId) => {
    setSelectedTeachers(prev => prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId])
  }

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, subject: true })
    if (!isValid) return
    setLoading(true)
    try {
      const classRes = await classAPI.createClass(formData)
      const newClass = classRes.data.data.class
      setCreatedClassId(newClass.id)
      for (const teacherId of selectedTeachers) { await classAPI.enrollStudent(newClass.id, teacherId) }
      for (const studentId of selectedStudents) { await classAPI.enrollStudent(newClass.id, studentId) }
      setSuccess(true)
    } catch (err) {
      console.error('Create class error:', err)
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create class'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout userRole="admin">
        <div className={styles.successPage}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}><PageIcon name="success" size={64} /></div>
            <h2 className={styles.successTitle}>Class Created Successfully!</h2>
            <p className={styles.successText}>Your new class is ready with {selectedTeachers.length} teacher(s) and {selectedStudents.length} student(s) enrolled.</p>
            <div className={styles.successActions}>
              <Button variant="primary" onClick={() => navigate('/admin/classes')}>View All Classes</Button>
              <Button variant="secondary" onClick={() => { setSuccess(false); setFormData({ name: '', subject: '', description: '' }); setSelectedTeachers([]); setSelectedStudents([]); setTouched({}) }}>Create Another</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.newClassPage}>
        <div className={styles.pageHeader}>
          <div>
            <button className={styles.backBtn} onClick={() => navigate('/admin/classes')}><PageIcon name="back" /> Back to Classes/button>
            <h1 className={styles.pageTitle}>Create New Class</h1>
            <p className={styles.pageSubtitle}>Set up a new class and assign teachers and students</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.createForm}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Class Details</h2>
            <div className={styles.formFields}>
              <Input label="Class Name" name="name" placeholder="e.g. Introduction to Python" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : ''} required disabled={loading} />
              <Input label="Subject" name="subject" placeholder="e.g. Computer Science" value={formData.subject} onChange={handleChange} onBlur={handleBlur} error={touched.subject ? errors.subject : ''} required disabled={loading} />
              <Textarea label="Description (Optional)" name="description" placeholder="Describe what students will learn..." value={formData.description} onChange={handleChange} rows={4} disabled={loading} />
            </div>
          </div>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Assign Teachers <span className={styles.sectionCount}>{selectedTeachers.length} selected</span></h2>
            {teachers.length === 0 ? <p className={styles.noUsers}>No teachers registered yet</p> : (
              <div className={styles.userGrid}>
                {teachers.map(teacher => (
                  <button key={teacher.id} type="button" className={`${styles.userCard} ${selectedTeachers.includes(teacher.id) ? styles.userCardSelected : ''}`} onClick={() => toggleTeacher(teacher.id)}>
                    <div className={styles.userAvatar}>{teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{teacher.name}</p>
                      <p className={styles.userEmail}>{teacher.email}</p>
                    </div>
                    {selectedTeachers.includes(teacher.id) && <span className={styles.checkmark}><PageIcon name="check" size={16} /></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Assign Students <span className={styles.sectionCount}>{selectedStudents.length} selected</span></h2>
            {students.length === 0 ? <p className={styles.noUsers}>No students registered yet</p> : (
              <div className={styles.userGrid}>
                {students.map(student => (
                  <button key={student.id} type="button" className={`${styles.userCard} ${selectedStudents.includes(student.id) ? styles.userCardSelected : ''}`} onClick={() => toggleStudent(student.id)}>
                    <div className={`${styles.userAvatar} ${styles.studentAvatar}`}>{student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{student.name}</p>
                      <p className={styles.userEmail}>{student.email}</p>
                    </div>
                    {selectedStudents.includes(student.id) && <span className={styles.checkmark}><PageIcon name="check" size={16} /></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/classes')} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" size="lg" disabled={loading || !isValid}>{loading ? 'Creating Class...' : 'Create Class'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default NewClass
