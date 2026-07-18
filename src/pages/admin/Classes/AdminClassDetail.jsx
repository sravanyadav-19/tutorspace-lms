import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, GraduationCap, Megaphone, ClipboardList, BookOpen, Plus, X, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { classAPI, userAPI } from '../../../services/api'
import styles from './AdminClassDetail.module.css'

const AdminClassDetail = () => {
  const { classId } = useParams()
  const navigate = useNavigate()

  const [cls, setCls] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [confirmModal, setConfirmModal] = useState({ open: false, userId: null, userName: '' })

  useEffect(() => { fetchData() }, [classId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [classRes, usersRes] = await Promise.all([classAPI.getClassById(classId), userAPI.getAllUsers()])
      setCls(classRes.data.data.class)
      setAllUsers(usersRes.data.data.users || [])
    } catch (err) { setError('Failed to load class details') }
    finally { setLoading(false) }
  }

  const handleEnroll = async (userId) => {
    try { await classAPI.enrollStudent(classId, userId); setSuccess('User enrolled successfully!'); setTimeout(() => setSuccess(''), 3000); fetchData() }
    catch (err) { setError(err.response?.data?.message || 'Failed to enroll user'); setTimeout(() => setError(''), 3000) }
  }

  const promptRemove = (userId, userName) => setConfirmModal({ open: true, userId, userName })

  const handleRemove = async () => {
    const { userId } = confirmModal
    if (!userId) return
    try { await classAPI.removeStudent(classId, userId); setSuccess('User removed successfully!'); setTimeout(() => setSuccess(''), 3000); fetchData() }
    catch (err) { setError('Failed to remove user'); setTimeout(() => setError(''), 3000) }
    finally { setConfirmModal({ open: false, userId: null, userName: '' }) }
  }

  const enrolledIds = cls?.enrollments?.map(e => e.userId) || []
  const teachers = allUsers.filter(u => u.role?.name === 'teacher')
  const students = allUsers.filter(u => u.role?.name === 'student')
  const enrolledTeachers = teachers.filter(t => enrolledIds.includes(t.id))
  const enrolledStudents = students.filter(s => enrolledIds.includes(s.id))
  const availableTeachers = teachers.filter(t => !enrolledIds.includes(t.id))
  const availableStudents = students.filter(s => !enrolledIds.includes(s.id))

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  if (loading) return (<DashboardLayout userRole="admin"><div className={styles.loadingState}><p>Loading class details...</p></div></DashboardLayout>)

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.classDetailPage}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/admin/classes')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Classes</button>
          <div className={styles.headerInfo}><h1 className={styles.pageTitle}>{cls?.name}</h1><p className={styles.pageSubtitle}>{cls?.subject} • Created {formatDate(cls?.createdAt)}</p></div>
        </div>

        {success && <div className={styles.successBanner}>{success}</div>}
        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        <div className={styles.statsRow}>
          <div className={styles.statCard}><Target size={22} color="#cc785c" /><div><p className={styles.statValue}>{enrolledTeachers.length}</p><p className={styles.statLabel}>Teachers</p></div></div>
          <div className={styles.statCard}><GraduationCap size={22} color="#cc785c" /><div><p className={styles.statValue}>{enrolledStudents.length}</p><p className={styles.statLabel}>Students</p></div></div>
          <div className={styles.statCard}><Megaphone size={22} color="#cc785c" /><div><p className={styles.statValue}>{cls?._count?.announcements || 0}</p><p className={styles.statLabel}>Announcements</p></div></div>
          <div className={styles.statCard}><ClipboardList size={22} color="#cc785c" /><div><p className={styles.statValue}>{cls?._count?.quizzes || 0}</p><p className={styles.statLabel}>Quizzes</p></div></div>
        </div>

        <div className={styles.tabs}>
          {['overview', 'teachers', 'students'].map(tab => (
            <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && <><BookOpen size={14} style={{ marginRight: '4px' }} /> Overview</>}
              {tab === 'teachers' && <><Target size={14} style={{ marginRight: '4px' }} /> Teachers ({enrolledTeachers.length})</>}
              {tab === 'students' && <><GraduationCap size={14} style={{ marginRight: '4px' }} /> Students ({enrolledStudents.length})</>}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.overviewCard}>
              <h3 className={styles.cardTitle}><BookOpen size={18} style={{ marginRight: '6px' }} /> Class Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Class Name</p><p className={styles.infoValue}>{cls?.name}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Subject</p><p className={styles.infoValue}>{cls?.subject}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Status</p><p className={styles.infoValue}>{cls?.status}</p></div>
                <div className={styles.infoItem}><p className={styles.infoLabel}>Created</p><p className={styles.infoValue}>{formatDate(cls?.createdAt)}</p></div>
                {cls?.description && <div className={`${styles.infoItem} ${styles.infoItemFull}`}><p className={styles.infoLabel}>Description</p><p className={styles.infoValue}>{cls?.description}</p></div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className={styles.tabContent}>
            <div className={styles.userSection}>
              <h3 className={styles.cardTitle}><Target size={18} style={{ marginRight: '6px' }} /> Enrolled Teachers ({enrolledTeachers.length})</h3>
              {enrolledTeachers.length === 0 ? <p className={styles.emptyText}>No teachers assigned yet.</p> : (
                <div className={styles.userList}>
                  {enrolledTeachers.map(teacher => (
                    <div key={teacher.id} className={styles.userCard}>
                      <div className={styles.userAvatar}>{teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={styles.userInfo}><p className={styles.userName}>{teacher.name}</p><p className={styles.userEmail}>{teacher.email}</p></div>
                      <button className={styles.removeBtn} onClick={() => promptRemove(teacher.id, teacher.name)}><X size={14} style={{ marginRight: '4px' }} /> Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {availableTeachers.length > 0 && (
              <div className={styles.userSection}>
                <h3 className={styles.cardTitle}><Plus size={18} style={{ marginRight: '6px' }} /> Add Teacher</h3>
                <div className={styles.userList}>
                  {availableTeachers.map(teacher => (
                    <div key={teacher.id} className={styles.userCard}>
                      <div className={styles.userAvatar}>{teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                      <div className={styles.userInfo}><p className={styles.userName}>{teacher.name}</p><p className={styles.userEmail}>{teacher.email}</p></div>
                      <button className={styles.addBtn} onClick={() => handleEnroll(teacher.id)}><Plus size={14} style={{ marginRight: '4px' }} /> Add</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className={styles.tabContent}>
            <>
              <div className={styles.userSection}>
                <h3 className={styles.cardTitle}><GraduationCap size={18} style={{ marginRight: '6px' }} /> Enrolled Students ({enrolledStudents.length})</h3>
                {enrolledStudents.length === 0 ? <p className={styles.emptyText}>No students enrolled yet.</p> : (
                  <div className={styles.userList}>
                    {enrolledStudents.map(student => (
                      <div key={student.id} className={styles.userCard}>
                        <div className={`${styles.userAvatar} ${styles.studentAvatar}`}>{student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className={styles.userInfo}><p className={styles.userName}>{student.name}</p><p className={styles.userEmail}>{student.email}</p></div>
                        <button className={styles.removeBtn} onClick={() => promptRemove(student.id, student.name)}><X size={14} style={{ marginRight: '4px' }} /> Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {availableStudents.length > 0 && (
                <div className={styles.userSection}>
                  <h3 className={styles.cardTitle}><Plus size={18} style={{ marginRight: '6px' }} /> Add Student</h3>
                  <div className={styles.userList}>
                    {availableStudents.map(student => (
                      <div key={student.id} className={styles.userCard}>
                        <div className={`${styles.userAvatar} ${styles.studentAvatar}`}>{student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div className={styles.userInfo}><p className={styles.userName}>{student.name}</p><p className={styles.userEmail}>{student.email}</p></div>
                        <button className={styles.addBtn} onClick={() => handleEnroll(student.id)}><Plus size={14} style={{ marginRight: '4px' }} /> Add</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, userId: null, userName: '' })} onConfirm={handleRemove} title="Remove User from Class" message={`Remove "${confirmModal.userName}" from this class? They will lose access to all class materials.`} confirmLabel="Remove" confirmVariant="danger" />
      </div>
    </DashboardLayout>
  )
}

export default AdminClassDetail