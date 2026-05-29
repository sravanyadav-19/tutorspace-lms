import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Megaphone, ClipboardList, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import StatCard from '../../../components/dashboard/StatCard'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { classAPI } from '../../../services/api'
import styles from './TeacherDashboard.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0, totalAnnouncements: 0, totalQuizzes: 0 })
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchTeacherData() }, [])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      const teacherClasses = res.data.data.classes
      setClasses(teacherClasses)
      const totalStudents = teacherClasses.reduce((sum, cls) => sum + (cls._count?.enrollments || 0), 0)
      const totalAnnouncements = teacherClasses.reduce((sum, cls) => sum + (cls._count?.announcements || 0), 0)
      const totalQuizzes = teacherClasses.reduce((sum, cls) => sum + (cls._count?.quizzes || 0), 0)
      setStats({ totalClasses: teacherClasses.length, totalStudents, totalAnnouncements, totalQuizzes })
    } catch (err) { setError('Failed to load teacher data') }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}><SkeletonGrid count={4} type="stat" /><SkeletonGrid count={2} type="card" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.teacherDashboard}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Welcome back, {user?.name}!</h1>
            <p className={styles.pageSubtitle}>Here's your teaching overview for today.</p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchTeacherData}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
            <Button variant="primary" onClick={() => navigate('/teacher/announcements/new')}><Megaphone size={16} style={{ marginRight: '6px' }} /> New Announcement</Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        <div className={styles.statsGrid}>
          <StatCard title="My Classes" value={stats.totalClasses} Icon={BookOpen} color="primary" subtitle="Classes you teach" />
          <StatCard title="Total Students" value={stats.totalStudents} Icon={Users} color="success" subtitle="Across all classes" />
          <StatCard title="Announcements" value={stats.totalAnnouncements} Icon={Megaphone} color="warning" subtitle="Posted by you" />
          <StatCard title="Quizzes Created" value={stats.totalQuizzes} Icon={ClipboardList} color="default" subtitle="Total assessments" />
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button className={styles.actionBtn} onClick={() => navigate('/teacher/classes')}><BookOpen size={18} /><span className={styles.actionLabel}>My Classes</span></button>
            <button className={styles.actionBtn} onClick={() => navigate('/teacher/announcements')}><Megaphone size={18} /><span className={styles.actionLabel}>Post Announcement</span></button>
            <button className={styles.actionBtn} onClick={() => navigate('/teacher/files')}><ClipboardList size={18} /><span className={styles.actionLabel}>Upload Files</span></button>
            <button className={styles.actionBtn} onClick={() => navigate('/teacher/quizzes')}><ClipboardList size={18} /><span className={styles.actionLabel}>Create Quiz</span></button>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3>
            <p className={styles.emptyText}>You haven't been assigned to any classes yet. Contact your administrator for class assignments.</p>
            <Button variant="secondary" onClick={() => navigate('/teacher/profile')}>Update Profile</Button>
          </div>
        ) : (
          <div className={styles.classesSection}>
            <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Your Classes</h2><Button variant="ghost" onClick={() => navigate('/teacher/classes')}>View All &rarr;</Button></div>
            <div className={styles.classesGrid}>
              {classes.slice(0, 3).map(cls => (
                <div key={cls.id} className={styles.classCard} onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
                  <div className={styles.classIcon}><BookOpen size={24} /></div>
                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>{cls.name}</h3>
                    <p className={styles.classSubject}>{cls.subject}</p>
                    <div className={styles.classStats}>
                      <span><Users size={12} style={{ marginRight: '4px' }} />{cls._count?.enrollments || 0} students</span>
                      <span><Megaphone size={12} style={{ marginRight: '4px' }} /> {cls._count?.announcements || 0} announcements</span>
                    </div>
                  </div>
                  <div className={styles.classActions}><span className={`${styles.statusBadge} ${styles[`status-${cls.status}`]}`}>{cls.status}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TeacherDashboard