import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RefreshCw, Megaphone, FileText, AlertCircle, Search, Filter, Users, ClipboardList } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI } from '../../../services/api'
import styles from './TeacherClasses.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'
import EmptyState from '../../../components/shared/EmptyState'

const TeacherClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])

  // Extract unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = (classes || []).map(c => c.subject).filter(Boolean)
    return Array.from(new Set(subjects))
  }, [classes])

  useEffect(() => {
    let result = [...(classes || [])]

    if (subjectFilter !== 'all') {
      result = result.filter(c => c.subject?.toLowerCase() === subjectFilter.toLowerCase())
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.subject?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      )
    }

    setFilteredClasses(result)
  }, [classes, searchTerm, subjectFilter])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      setClasses(res?.data?.data?.classes || [])
    } catch (err) {
      setError('Failed to load your assigned classes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.classesPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>My Classes</h1>
            <p className={styles.pageSubtitle}>Courses assigned to you ({classes.length} total active classes)</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchClasses}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate('/teacher/announcements')}>
              <Megaphone size={16} style={{ marginRight: '6px' }} /> New Announcement
            </Button>
          </div>
        </div>

        {/* Toolbar Search & Subject Selector */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search classes by title, subject, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterWrapper}>
            <Filter size={16} className={styles.filterIcon} />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={styles.subjectSelect}
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className={styles.errorState} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? (
          <SkeletonGrid count={3} type="card" />
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon="classes"
            title={searchTerm || subjectFilter !== 'all' ? 'No Classes Found' : 'No Classes Assigned'}
            message={searchTerm || subjectFilter !== 'all' ? 'Try adjusting your search query or subject filter' : 'You are not assigned to any classes yet. Contact your administrator.'}
          />
        ) : (
          <>
            <p className={styles.resultsCount}>Showing {filteredClasses.length} of {classes.length} classes</p>

            <div className={styles.classesGrid}>
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  className={styles.classCard}
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.classIcon}>
                      <BookOpen size={24} color="#cc785c" />
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status-${cls.status}`]}`}>
                      {cls.status}
                    </span>
                  </div>

                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>{cls.name}</h3>
                    <p className={styles.classSubject}>{cls.subject}</p>
                    {cls.description && <p className={styles.classDescription}>{cls.description}</p>}
                  </div>

                  <div className={styles.classStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        <Users size={14} style={{ marginRight: '4px' }} />
                        {cls._count?.enrollments || 0}
                      </span>
                      <span className={styles.statLabel}>Students</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        <Megaphone size={14} style={{ marginRight: '4px' }} />
                        {cls._count?.announcements || 0}
                      </span>
                      <span className={styles.statLabel}>Updates</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        <ClipboardList size={14} style={{ marginRight: '4px' }} />
                        {cls._count?.quizzes || 0}
                      </span>
                      <span className={styles.statLabel}>Quizzes</span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate('/teacher/announcements') }}
                    >
                      <Megaphone size={14} style={{ marginRight: '4px' }} /> Post Update
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/teacher/classes/${cls.id}`) }}
                    >
                      <FileText size={14} style={{ marginRight: '4px' }} /> Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TeacherClasses