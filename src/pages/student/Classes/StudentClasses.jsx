import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RefreshCw, Megaphone, ClipboardList, Users, AlertCircle, Search, FileText, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI } from '../../../services/api'
import styles from './StudentClasses.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'
import EmptyState from '../../../components/shared/EmptyState'

const StudentClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])

  useEffect(() => {
    let result = [...(classes || [])]
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.subject?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      )
    }
    setFilteredClasses(result)
  }, [classes, searchTerm])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await classAPI.getStudentClasses()
      const studentClasses = res?.data?.data?.classes || []
      setClasses(studentClasses)
      setFilteredClasses(studentClasses)
    } catch (err) {
      setError('Failed to load your classes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.classesPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <BookOpen size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              My Classes
            </h1>
            <p className={styles.pageSubtitle}>Courses you are currently enrolled in ({classes.length} total active classes)</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchClasses}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search enrolled classes by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? (
          <SkeletonGrid count={4} type="card" />
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon="classes"
            title={searchTerm ? 'No Classes Match Search' : 'No Classes Enrolled'}
            message={searchTerm ? 'Try typing a different course name or subject' : 'You are not enrolled in any active classes yet. Contact your administrator.'}
          />
        ) : (
          <div className={styles.classesGrid}>
            {filteredClasses.map(cls => (
              <div key={cls.id} className={styles.classCard}>
                <div className={styles.cardTop}>
                  <div className={styles.classIcon}>
                    <BookOpen size={24} color="#cc785c" />
                  </div>
                  <span className={styles.statusBadge}>Enrolled</span>
                </div>

                <div className={styles.classInfo}>
                  <h3 className={styles.className}>{cls.name}</h3>
                  <p className={styles.classSubject}>{cls.subject}</p>
                  {cls.description && <p className={styles.classDescription}>{cls.description}</p>}
                </div>

                <div className={styles.classStatsRow}>
                  <div className={styles.statPill}>
                    <Megaphone size={12} />
                    <span>{cls._count?.announcements || 0} updates</span>
                  </div>
                  <div className={styles.statPill}>
                    <ClipboardList size={12} />
                    <span>{cls._count?.quizzes || 0} quizzes</span>
                  </div>
                  <div className={styles.statPill}>
                    <Users size={12} />
                    <span>{cls._count?.enrollments || 0} students</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate('/student/announcements')}
                    title="View announcements"
                  >
                    <Megaphone size={14} /> Announcements
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate('/student/files')}
                    title="View study files"
                  >
                    <FileText size={14} /> Files
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.quizBtn}`}
                    onClick={() => navigate('/student/quizzes')}
                    title="Take quizzes"
                  >
                    <ClipboardList size={14} /> Quizzes <ArrowRight size={12} />
                  </button>
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