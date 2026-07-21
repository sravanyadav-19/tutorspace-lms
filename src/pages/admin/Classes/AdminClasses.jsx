import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RefreshCw, PlusCircle, Trash2, FileText, AlertCircle, Search, Filter, Users, Megaphone, ClipboardList } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { classAPI } from '../../../services/api'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'
import { useToast } from '../../../context/ToastContext'
import styles from './AdminClasses.module.css'
import EmptyState from '../../../components/shared/EmptyState'

const AdminClasses = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, classId: null, className: '' })

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
      const res = await classAPI.getAllClasses()
      setClasses(res?.data?.data?.classes || [])
    } catch (err) {
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const promptDelete = (e, classId, className) => {
    e.stopPropagation()
    setConfirmModal({ open: true, classId, className })
  }

  const handleDelete = async () => {
    const { classId } = confirmModal
    if (!classId) return
    setDeleting(classId)
    try {
      await classAPI.deleteClass(classId)
      setClasses(prev => (prev || []).filter(c => c.id !== classId))
      toast.success('Class deleted successfully')
    } catch (err) {
      toast.error('Failed to delete class')
    } finally {
      setDeleting(null)
      setConfirmModal({ open: false, classId: null, className: '' })
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className={styles.classesPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Class Management</h1>
            <p className={styles.pageSubtitle}>Organize courses, view rosters, and manage enrollments ({classes.length} total active classes)</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchClasses}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/classes/new')}>
              <PlusCircle size={16} style={{ marginRight: '6px' }} /> Create Class
            </Button>
          </div>
        </div>

        {/* Toolbar Search & Subject Filters */}
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
            title="No Classes Found"
            message={searchTerm || subjectFilter !== 'all' ? 'Try adjusting your search terms or subject filter' : 'Create your first class to start adding teachers and students.'}
          />
        ) : (
          <>
            <p className={styles.resultsCount}>Showing {filteredClasses.length} of {classes.length} classes</p>

            <div className={styles.classesGrid}>
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  className={styles.classCard}
                  onClick={() => navigate(`/admin/classes/${cls.id}`)}
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
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/classes/${cls.id}`) }}
                      className={styles.detailsBtn}
                    >
                      <FileText size={14} style={{ marginRight: '4px' }} /> View Details
                    </Button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => promptDelete(e, cls.id, cls.name)}
                      title="Delete class"
                      aria-label="Delete class"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, classId: null, className: '' })}
          onConfirm={handleDelete}
          title="Delete Class"
          message={`Are you sure you want to delete "${confirmModal.className}"? All enrolled rosters, announcements, and quizzes associated with this class will be permanently removed.`}
          confirmLabel="Delete Class"
          confirmVariant="danger"
          loading={deleting === confirmModal.classId}
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminClasses