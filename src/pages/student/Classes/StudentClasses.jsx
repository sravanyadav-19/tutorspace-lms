import React, { useState, useEffect } from 'react'
import { BookOpen, RefreshCw, Megaphone, ClipboardList, Users, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI } from '../../../services/api'
import styles from './StudentClasses.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const StudentClasses = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    try { setLoading(true); setError(''); const res = await classAPI.getStudentClasses(); setClasses(res.data.data.classes || []) }
    catch (err) { setError('Failed to load your classes') }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.classesPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><BookOpen size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> My Classes</h1>
            <p className={styles.pageSubtitle}>View all classes you are enrolled in</p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonGrid count={4} type="card" /> : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Found</h3>
            <p className={styles.emptyText}>You are not enrolled in any classes yet.</p>
          </div>
        ) : (
          <div className={styles.classesGrid}>
            {classes.map(cls => (
              <div key={cls.id} className={styles.classCard}>
                <div className={styles.classIcon}><BookOpen size={24} /></div>
                <div className={styles.classInfo}>
                  <h3 className={styles.className}>{cls.name}</h3>
                  <p className={styles.classSubject}>{cls.subject}</p>
                  {cls.description && <p className={styles.classDescription}>{cls.description}</p>}
                  <div className={styles.classStats}>
                    <span><Megaphone size={12} style={{ marginRight: '4px' }} /> {cls._count?.announcements || 0} announcements</span>
                    <span><ClipboardList size={12} style={{ marginRight: '4px' }} /> {cls._count?.quizzes || 0} quizzes</span>
                    <span><Users size={12} /> {cls._count?.enrollments || 0} enrolled</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentClasses
