import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import Input from '../../../components/shared/Input'
import { classAPI } from '../../../services/api'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'
import styles from './AdminClasses.module.css'

const AdminClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredClasses(classes.filter(c =>
        c.name.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase()
          .includes(searchTerm.toLowerCase())
      ))
    } else {
      setFilteredClasses(classes)
    }
  }, [classes, searchTerm])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getAllClasses()
      setClasses(res.data.data.classes)
    } catch (err) {
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (classId, className) => {
    if (!window.confirm(
      `Delete "${className}"? This cannot be undone.`
    )) return

    try {
      await classAPI.deleteClass(classId)
      setClasses(prev => 
        prev.filter(c => c.id !== classId)
      )
    } catch (err) {
      alert('Failed to delete class')
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.classesPage}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Class Management
            </h1>
            <p className={styles.pageSubtitle}>
              {classes.length} total classes
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={fetchClasses}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/classes/new')}
            >
              + Create Class
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <Input
            type="text"
            placeholder="Search classes by name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorState}>⚠️ {error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <SkeletonGrid count={4} type="card" />
        ) : filteredClasses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>
              No classes found
            </h3>
            <p className={styles.emptyText}>
              {searchTerm
                ? 'Try a different search term'
                : 'Create your first class to get started'}
            </p>
            {!searchTerm && (
              <Button
                variant="primary"
                onClick={() => navigate('/admin/classes/new')}
              >
                + Create First Class
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>
              Showing {filteredClasses.length} of{' '}
              {classes.length} classes
            </p>

            {/* Classes Grid */}
            <div className={styles.classesGrid}>
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  className={styles.classCard}
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.classIcon}>
                      📚
                    </div>
                    <span className={`
                      ${styles.statusBadge}
                      ${styles[`status-${cls.status}`]}
                    `}>
                      {cls.status}
                    </span>
                  </div>

                  {/* Class Info */}
                  <div className={styles.classInfo}>
                    <h3 className={styles.className}>
                      {cls.name}
                    </h3>
                    <p className={styles.classSubject}>
                      {cls.subject}
                    </p>
                    {cls.description && (
                      <p className={styles.classDescription}>
                        {cls.description}
                      </p>
                    )}
                  </div>

                  {/* Class Stats */}
                  <div className={styles.classStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.enrollments || 0}
                      </span>
                      <span className={styles.statLabel}>
                        Students
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.announcements || 0}
                      </span>
                      <span className={styles.statLabel}>
                        Announcements
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {cls._count?.quizzes || 0}
                      </span>
                      <span className={styles.statLabel}>
                        Quizzes
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className={styles.cardActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(
                        `/admin/classes/${cls.id}`
                      )}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDelete(cls.id, cls.name)
                      }
                    >
                      🗑️ Delete
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

export default AdminClasses
