import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Megaphone,
  ClipboardList,
  Trophy,
  RefreshCw,
  AlertCircle,
  FileText,
  MessageCircle,
  ArrowRight,
  Target,
  Clock,
  Sparkles
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import StatCard from '../../../components/dashboard/StatCard'
import Button from '../../../components/shared/Button'
import { useAuth } from '../../../context/AuthContext'
import { classAPI, announcementAPI, quizAPI } from '../../../services/api'
import { countByStatus } from '../../../utils/studentQuiz'
import styles from './StudentDashboard.module.css'
import { SkeletonGrid } from '../../../components/shared/Skeleton/Skeleton'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalClasses: 0,
    totalAnnouncements: 0,
    readyQuizzes: 0,
    awaitingRelease: 0,
    gradedQuizzes: 0
  })
  const [classes, setClasses] = useState([])
  const [recentAnnouncements, setRecentAnnouncements] = useState([])
  const [selectedClassFilter, setSelectedClassFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      setError('')

      const [classesRes, quizzesRes] = await Promise.all([
        classAPI.getStudentClasses(),
        quizAPI.getStudentQuizzes().catch(() => null)
      ])

      const studentClasses = classesRes?.data?.data?.classes || []
      setClasses(studentClasses)

      const totalAnnouncements = studentClasses.reduce(
        (sum, cls) => sum + (cls._count?.announcements || 0),
        0
      )

      // Real quiz readiness from student quiz list (not class _count.quizzes)
      const quizList = quizzesRes?.data?.data?.quizzes || []
      const quizCounts = countByStatus(quizList)

      setStats({
        totalClasses: studentClasses.length,
        totalAnnouncements,
        readyQuizzes: quizCounts.ready,
        awaitingRelease: quizCounts.awaitingRelease,
        gradedQuizzes: quizCounts.graded
      })

      if (studentClasses.length > 0) {
        const announcementPromises = studentClasses.map((cls) =>
          announcementAPI
            .getClassAnnouncements(cls.id)
            .then((r) =>
              (r?.data?.data?.announcements || []).map((a) => ({
                ...a,
                classId: cls.id,
                className: cls.name,
                subject: cls.subject
              }))
            )
            .catch(() => [])
        )
        const announcementResults = await Promise.all(announcementPromises)
        const allAnnouncements = announcementResults.flat()
        allAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRecentAnnouncements(allAnnouncements)
      } else {
        setRecentAnnouncements([])
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.max(0, now - date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 60) return `${minutes || 1}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isNewPost = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    return now - date < 24 * 60 * 60 * 1000
  }

  const filteredAnnouncements = recentAnnouncements.filter((a) => {
    if (selectedClassFilter === 'all') return true
    return a.classId === selectedClassFilter
  })

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SkeletonGrid count={3} type="stat" />
          <SkeletonGrid count={2} type="card" />
        </div>
      </DashboardLayout>
    )
  }

  const hasReadyQuizzes = stats.readyQuizzes > 0
  const hasAwaitingOnly =
    !hasReadyQuizzes && stats.awaitingRelease > 0

  return (
    <DashboardLayout userRole="student">
      <div className={styles.studentDashboard}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Welcome back, {user?.name}!</h1>
            <p className={styles.pageSubtitle}>
              Here&apos;s your learning overview for today.
            </p>
          </div>
          <div className={styles.headerRight}>
            <Button variant="secondary" onClick={fetchStudentData}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}
          </div>
        )}

        {/* Only show "ready" banner when there are quizzes not yet taken */}
        {hasReadyQuizzes && (
          <div className={styles.quizAlertBanner}>
            <div className={styles.quizAlertLeft}>
              <Clock size={20} className={styles.alertIcon} />
              <div>
                <p className={styles.alertTitle}>
                  {stats.readyQuizzes === 1
                    ? '1 quiz ready to take'
                    : `${stats.readyQuizzes} quizzes ready to take`}
                </p>
                <p className={styles.alertText}>
                  Start when you&apos;re ready — timers begin when you open a quiz.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/student/quizzes?tab=ready')}
            >
              View ready quizzes <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Button>
          </div>
        )}

        {/* Secondary info: submitted but grades not released yet */}
        {hasAwaitingOnly && (
          <div className={styles.awaitingBanner}>
            <div className={styles.quizAlertLeft}>
              <Trophy size={20} className={styles.awaitingIcon} />
              <div>
                <p className={styles.awaitingTitle}>
                  {stats.awaitingRelease === 1
                    ? '1 quiz awaiting grade release'
                    : `${stats.awaitingRelease} quizzes awaiting grade release`}
                </p>
                <p className={styles.awaitingText}>
                  You&apos;ve submitted — scores appear after your teacher releases results.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/student/quizzes?tab=awaiting')}
            >
              View submitted
            </Button>
          </div>
        )}

        <div className={styles.statsGrid}>
          <StatCard
            title="My Classes"
            value={stats.totalClasses}
            Icon={BookOpen}
            color="primary"
            subtitle="Enrolled classes"
          />
          <StatCard
            title="Announcements"
            value={stats.totalAnnouncements}
            Icon={Megaphone}
            color="warning"
            subtitle="From your teachers"
          />
          <StatCard
            title="Ready to take"
            value={stats.readyQuizzes}
            Icon={ClipboardList}
            color="success"
            subtitle={
              stats.awaitingRelease > 0
                ? `${stats.awaitingRelease} awaiting release`
                : stats.gradedQuizzes > 0
                  ? `${stats.gradedQuizzes} graded`
                  : 'Quizzes you can start'
            }
          />
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/announcements')}
            >
              <Megaphone size={18} />
              <span className={styles.actionLabel}>Announcements</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/files')}
            >
              <FileText size={18} />
              <span className={styles.actionLabel}>Study Files</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/quizzes')}
            >
              <ClipboardList size={18} />
              <span className={styles.actionLabel}>
                {hasReadyQuizzes ? 'Take Quiz' : 'My Quizzes'}
              </span>
              {hasReadyQuizzes && (
                <span className={styles.actionBadge}>{stats.readyQuizzes}</span>
              )}
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigate('/student/results')}
            >
              <Trophy size={18} />
              <span className={styles.actionLabel}>My Results</span>
            </button>
          </div>
        </div>

        {classes.length === 0 ? (
          <EmptyState
            icon="classes"
            title="No Classes Enrolled"
            message="You haven't been enrolled in any classes yet. Contact your administrator."
          />
        ) : (
          <div className={styles.announcementsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Recent Announcements</h2>
                <p className={styles.sectionSubtitle}>
                  Updates and homework broadcasts from your instructors
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/student/announcements')}
              >
                View All &rarr;
              </Button>
            </div>

            {classes.length > 1 && (
              <div className={styles.filterPills}>
                <button
                  className={`${styles.pillBtn} ${selectedClassFilter === 'all' ? styles.pillActive : ''}`}
                  onClick={() => setSelectedClassFilter('all')}
                >
                  All Classes ({recentAnnouncements.length})
                </button>
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    className={`${styles.pillBtn} ${selectedClassFilter === cls.id ? styles.pillActive : ''}`}
                    onClick={() => setSelectedClassFilter(cls.id)}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            )}

            {filteredAnnouncements.length === 0 ? (
              <EmptyState
                icon="announcements"
                title="No Announcements Found"
                message={
                  selectedClassFilter === 'all'
                    ? "Your teachers haven't posted any updates recently."
                    : 'No updates found for this class.'
                }
                size="sm"
              />
            ) : (
              <div className={styles.announcementsGrid}>
                {filteredAnnouncements.slice(0, 4).map((announcement) => {
                  const isNew = isNewPost(announcement.createdAt)
                  return (
                    <div
                      key={announcement.id}
                      className={styles.announcementCard}
                      onClick={() =>
                        navigate(`/student/announcements/${announcement.id}`)
                      }
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.cardTagsGroup}>
                          {isNew && (
                            <span className={styles.newBadge}>
                              <Sparkles size={10} style={{ marginRight: '2px' }} />{' '}
                              NEW
                            </span>
                          )}
                          <span className={styles.classTag}>
                            {announcement.className}
                          </span>
                        </div>
                        <span className={styles.timeTag}>
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>

                      <h3 className={styles.announcementTitle}>
                        {announcement.title}
                      </h3>

                      <p className={styles.announcementSnippet}>
                        {announcement.content?.length > 140
                          ? announcement.content.substring(0, 140) + '...'
                          : announcement.content}
                      </p>

                      <div className={styles.cardBottom}>
                        <div className={styles.authorMeta}>
                          <Target size={14} color="#cc785c" />
                          <span>{announcement.author?.name || 'Teacher'}</span>
                        </div>
                        <div className={styles.commentMeta}>
                          <MessageCircle size={12} />
                          <span>{announcement._count?.comments || 0}</span>
                          <ArrowRight size={12} className={styles.arrowIcon} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
