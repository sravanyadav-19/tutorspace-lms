import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../../components/layout/DashboardLayout'
import Button from '../../../../components/shared/Button'
import Input from '../../../../components/shared/Input'
import { Textarea } from '../../../../components/shared/Input'
import { classAPI, userAPI } from '../../../../services/api'
import styles from './NewClass.module.css'

const NewClass = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [students, setStudents] = useState([])
  const [createdClassId, setCreatedClassId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers()
      const allUsers = res.data.data.users
      setTeachers(
        allUsers.filter(u => u.role.name === 'teacher')
      )
      setStudents(
        allUsers.filter(u => u.role.name === 'student')
      )
    } catch (err) {
      console.error('Failed to fetch users')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required'
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    return newErrors
  }

  const toggleTeacher = (teacherId) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      // Create class
      const classRes = await classAPI.createClass(formData)
      const newClass = classRes.data.data.class
      setCreatedClassId(newClass.id)

      // Enroll selected teachers
      for (const teacherId of selectedTeachers) {
        await classAPI.enrollStudent(newClass.id, teacherId)
      }

      // Enroll selected students
      for (const studentId of selectedStudents) {
        await classAPI.enrollStudent(newClass.id, studentId)
      }

      setSuccess(true)

    } catch (err) {
      console.error('Create class error:', err)
      alert(
        err.response?.data?.message || 
        'Failed to create class'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout userRole="admin">
        <div className={styles.successPage}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.successTitle}>
              Class Created Successfully!
            </h2>
            <p className={styles.successText}>
              Your new class is ready with{' '}
              {selectedTeachers.length} teacher(s) and{' '}
              {selectedStudents.length} student(s) enrolled.
            </p>
            <div className={styles.successActions}>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/classes')}
              >
                View All Classes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    name: '',
                    subject: '',
                    description: ''
                  })
                  setSelectedTeachers([])
                  setSelectedStudents([])
                }}
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.newClassPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <button
              className={styles.backBtn}
              onClick={() => navigate('/admin/classes')}
            >
              ← Back to Classes
            </button>
            <h1 className={styles.pageTitle}>
              Create New Class
            </h1>
            <p className={styles.pageSubtitle}>
              Set up a new class and assign teachers and students
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.createForm}
        >
          {/* Class Details Section */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              📋 Class Details
            </h2>

            <div className={styles.formFields}>
              <Input
                label="Class Name"
                name="name"
                placeholder="e.g. Introduction to Python"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <Input
                label="Subject"
                name="subject"
                placeholder="e.g. Computer Science"
                value={formData.subject}
                onChange={handleChange}
                error={errors.subject}
                required
              />

              <Textarea
                label="Description (Optional)"
                name="description"
                placeholder="Describe what students will learn..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          {/* Assign Teachers */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              👨‍🏫 Assign Teachers
              <span className={styles.sectionCount}>
                {selectedTeachers.length} selected
              </span>
            </h2>

            {teachers.length === 0 ? (
              <p className={styles.noUsers}>
                No teachers registered yet
              </p>
            ) : (
              <div className={styles.userGrid}>
                {teachers.map(teacher => (
                  <button
                    key={teacher.id}
                    type="button"
                    className={`
                      ${styles.userCard}
                      ${selectedTeachers.includes(teacher.id)
                        ? styles.userCardSelected
                        : ''}
                    `}
                    onClick={() => toggleTeacher(teacher.id)}
                  >
                    <div className={styles.userAvatar}>
                      {teacher.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>
                        {teacher.name}
                      </p>
                      <p className={styles.userEmail}>
                        {teacher.email}
                      </p>
                    </div>
                    {selectedTeachers.includes(teacher.id)
                      && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assign Students */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              🎓 Assign Students
              <span className={styles.sectionCount}>
                {selectedStudents.length} selected
              </span>
            </h2>

            {students.length === 0 ? (
              <p className={styles.noUsers}>
                No students registered yet
              </p>
            ) : (
              <div className={styles.userGrid}>
                {students.map(student => (
                  <button
                    key={student.id}
                    type="button"
                    className={`
                      ${styles.userCard}
                      ${selectedStudents.includes(student.id)
                        ? styles.userCardSelected
                        : ''}
                    `}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className={`
                      ${styles.userAvatar}
                      ${styles.studentAvatar}
                    `}>
                      {student.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>
                        {student.name}
                      </p>
                      <p className={styles.userEmail}>
                        {student.email}
                      </p>
                    </div>
                    {selectedStudents.includes(student.id)
                      && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/classes')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
            >
              {loading
                ? 'Creating Class...'
                : '✅ Create Class'
              }
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default NewClass
