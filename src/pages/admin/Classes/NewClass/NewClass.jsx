import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Target, GraduationCap, CheckCircle, PlusCircle, Search } from 'lucide-react'
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
  const [students, setStudents] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])

  const [teacherSearch, setTeacherSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

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
      const allUsers = res?.data?.data?.users || []
      setTeachers(allUsers.filter((u) => u.role?.name === 'teacher' && u.status === 'active'))
      setStudents(allUsers.filter((u) => u.role?.name === 'student' && u.status === 'active'))
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleBlur = (e) => { const { name } = e.target; setTouched(prev => ({ ...prev, [name]: true })) }

  const toggleTeacher = (teacherId) => setSelectedTeachers(prev => prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId])
  const toggleStudent = (studentId) => setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId])

  const selectAllTeachers = () => {
    const visibleTeacherIds = filteredTeachers.map(t => t.id)
    if (selectedTeachers.length === visibleTeacherIds.length) {
      setSelectedTeachers([])
    } else {
      setSelectedTeachers(visibleTeacherIds)
    }
  }

  const selectAllStudents = () => {
    const visibleStudentIds = filteredStudents.map(s => s.id)
    if (selectedStudents.length === visibleStudentIds.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(visibleStudentIds)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, subject: true })
    if (!isValid) return
    setLoading(true)
    try {
      const classRes = await classAPI.createClass(formData)
      const newClass = classRes?.data?.data?.class
      if (newClass?.id) {
        for (const teacherId of selectedTeachers) { await classAPI.enrollStudent(newClass.id, teacherId) }
        for (const studentId of selectedStudents) { await classAPI.enrollStudent(newClass.id, studentId) }
      }
      setSuccess(true)
      toast.success('Class created successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to create class'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(teacherSearch.toLowerCase().trim()) ||
    t.email?.toLowerCase().includes(teacherSearch.toLowerCase().trim())
  )

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase().trim()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase().trim())
  )

  if (success) {
    return (
      <DashboardLayout userRole="admin">
        <div className={styles.successPage}>
          <div className={styles.successCard}>
            <CheckCircle size={48} color="#5db872" style={{ marginBottom: '16px' }} />
            <h2 className={styles.successTitle}>Class Created Successfully!</h2>
            <p className={styles.successText}>Your new class &quot;{formData.name}&quot; is ready with {selectedTeachers.length} teacher(s) and {selectedStudents.length} student(s) enrolled.</p>
            <div className={styles.successActions}>
              <Button variant="primary" onClick={() => navigate('/admin/classes')}>View All Classes</Button>
              <Button variant="secondary" onClick={() => { setSuccess(false); setFormData({ name: '', subject: '', description: '' }); setSelectedTeachers([]); setSelectedStudents([]); setTouched({}) }}>Create Another Class</Button>
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
            <button className={styles.backBtn} onClick={() => navigate('/admin/classes')}>
              <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Classes
            </button>
            <h1 className={styles.pageTitle}>Create New Class</h1>
            <p className={styles.pageSubtitle}>Set up a course, configure details, and assign instructors and students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.createForm}>
          {/* Class Details Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <BookOpen size={18} style={{ marginRight: '6px' }} /> Class Details
            </h2>
            <div className={styles.formFields}>
              <Input label="Class Name *" name="name" placeholder="e.g. Introduction to Computer Science" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : ''} required disabled={loading} />
              <Input label="Subject *" name="subject" placeholder="e.g. Computer Science" value={formData.subject} onChange={handleChange} onBlur={handleBlur} error={touched.subject ? errors.subject : ''} required disabled={loading} />
              <Textarea label="Description (Optional)" name="description" placeholder="Describe the topics covered in this class..." value={formData.description} onChange={handleChange} rows={4} disabled={loading} />
            </div>
          </div>

          {/* Assign Teachers Section */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Target size={18} style={{ marginRight: '6px' }} /> Assign Teachers
                <span className={`${styles.sectionCount} ${styles.teacherCount}`}>{selectedTeachers.length} selected</span>
              </h2>
              {filteredTeachers.length > 0 && (
                <button type="button" className={styles.selectAllBtn} onClick={selectAllTeachers}>
                  {selectedTeachers.length === filteredTeachers.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {teachers.length > 0 && (
              <div className={styles.filterBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter teachers by name or email..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            )}

            {filteredTeachers.length === 0 ? (
              <p className={styles.noUsers}>
                {teacherSearch ? 'No active teachers match your search filter' : 'No active teacher accounts registered yet.'}
              </p>
            ) : (
              <div className={styles.userGrid}>
                {filteredTeachers.map(teacher => {
                  const isSelected = selectedTeachers.includes(teacher.id)
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      className={`${styles.userCard} ${isSelected ? styles.userCardSelected : ''}`}
                      onClick={() => toggleTeacher(teacher.id)}
                    >
                      <div className={styles.userAvatar}>
                        {(teacher.name || 'T').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{teacher.name}</p>
                        <p className={styles.userEmail}>{teacher.email}</p>
                      </div>
                      {isSelected && <CheckCircle size={18} className={styles.checkIcon} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assign Students Section */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <GraduationCap size={18} style={{ marginRight: '6px' }} /> Assign Students
                <span className={`${styles.sectionCount} ${styles.studentCount}`}>{selectedStudents.length} selected</span>
              </h2>
              {filteredStudents.length > 0 && (
                <button type="button" className={styles.selectAllBtn} onClick={selectAllStudents}>
                  {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {students.length > 0 && (
              <div className={styles.filterBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            )}

            {filteredStudents.length === 0 ? (
              <p className={styles.noUsers}>
                {studentSearch ? 'No active students match your search filter' : 'No active student accounts registered yet.'}
              </p>
            ) : (
              <div className={styles.userGrid}>
                {filteredStudents.map(student => {
                  const isSelected = selectedStudents.includes(student.id)
                  return (
                    <button
                      key={student.id}
                      type="button"
                      className={`${styles.userCard} ${isSelected ? styles.studentCardSelected : ''}`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <div className={`${styles.userAvatar} ${styles.studentAvatar}`}>
                        {(student.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{student.name}</p>
                        <p className={styles.userEmail}>{student.email}</p>
                      </div>
                      {isSelected && <CheckCircle size={18} className={styles.studentCheckIcon} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/classes')} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading || !isValid}>
              {loading ? 'Creating Class...' : <><PlusCircle size={16} style={{ marginRight: '6px' }} /> Create Class</>}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default NewClass