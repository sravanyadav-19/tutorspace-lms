import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import Input from '../../../components/shared/Input'
import { classAPI } from '../../../services/api'
import styles from './TeacherClasses.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const TeacherClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredClasses(classes.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    } else {
      setFilteredClasses(classes)
    }
  }, [classes, searchTerm])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      setClasses(res.data.data.classes)
    } catch (err) {
      setError('Failed to load your classes')
      console.error('Teacher classes error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.classesPage}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>My Classes</h1>
            <p className={styles.pageSubtitle}>
              Classes assigned to you ({classes.length} total)
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchClasses}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        <div className={styles.searchBar}>
          <Input
            type="text"
            placeholder="Search your classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && <div className={styles.errorState}>⚠️ {error}</div>}

        {loading ? (
          <SkeletonGrid count={4} type="card" />
        ) : filteredClasses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>
              {searchTerm ? 'No classes found' : 'No classes assigned'}
            </h3>
            <p className={styles.emptyText}>
              {searchTerm 
                ? 'Try a different search term'
                : 'Contact your administrator to get assigned to classes'}
            </p>
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>
              Showing {filteredClasses.length} of {classes.length} classes
            </p>

            <div className={styles.classesGrid}>
              {filteredClasses.map(cls => (
                <div key={cls.id} className={styles.classCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.classIcon}>📚</div>
                    <span className={`${styles.statusBadge} ${styles[`status-${cls.status}`]}`}>
                      {cls.status}
                    </span>
                  </div>

                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>{cls.name}</h3>
                    <p className={styles.classSubject}>{cls.subject}</p>
                    {cls.description && (
                      <p className={styles.classDescription}>{cls.description}</p>
                    )}
                  </div>

                  <div className={styles.classStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.enrollments || 0}
                      </span>
                      <span className={styles.statLabel}>Students</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.announcements || 0}
                      </span>
                      <span className={styles.statLabel}>Announcements</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.quizzes || 0}
                      </span>
                      <span className={styles.statLabel}>Quizzes</span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/teacher/classes/${cls.id}/announcements/new`)}
                    >
                      📢 Post Announcement
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                    >
                      📄 View Details
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
