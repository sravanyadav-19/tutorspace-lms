import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, BookOpen, RefreshCw, Eye, Image, Lock, ZoomIn, ArrowLeft, AlertCircle, Search } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EmptyState from '../../../components/shared/EmptyState'
import Button from '../../../components/shared/Button'
import { classAPI, fileAPI } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import styles from './StudentFiles.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'

const StudentFiles = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoomed, setZoomed] = useState(false)
  const [fileSearch, setFileSearch] = useState('')
  const token = localStorage.getItem('tutorspace_token')

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass?.id) { fetchFiles(selectedClass.id); setSelectedFile(null); setFileSearch('') } }, [selectedClass])

  useEffect(() => {
    if (!selectedFile) return
    const blockKeys = (e) => {
      if (e.ctrlKey && ['s', 'p', 'u', 'i', 'S', 'P', 'U', 'I'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); return false }
      if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); return false }
    }
    document.addEventListener('keydown', blockKeys, true)
    return () => document.removeEventListener('keydown', blockKeys, true)
  }, [selectedFile])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await classAPI.getStudentClasses()
      const sc = res?.data?.data?.classes || []
      setClasses(sc)
      if (sc.length > 0) setSelectedClass(sc[0])
    } catch (err) {
      setError('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchFiles = async (classId) => {
    try {
      setFilesLoading(true)
      const res = await fileAPI.getClassFiles(classId)
      setFiles(res?.data?.data?.files || [])
    } catch (err) {
      setFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  const handleViewFile = (file) => { setSelectedFile(file); setZoomed(false) }
  const handleCloseViewer = () => { setSelectedFile(null); setZoomed(false); navigate('/student/files') }
  const API_URL = import.meta.env.VITE_API_URL || 'https://tutorspace-lms.onrender.com/api'
  const getViewUrl = (fileId) => `${API_URL}/files/view/${fileId}?token=${token}`
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getWatermarkText = () => {
    const name = user?.name || 'Student'
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return `${name} • ${date} • TutorSpace`
  }

  const filteredFiles = (files || []).filter(file =>
    (file.description || file.originalName || '').toLowerCase().includes(fileSearch.toLowerCase().trim())
  )

  if (selectedFile) {
    return (
      <div className={styles.fullPageViewer} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}>
        <div className={styles.viewerHeader}>
          <button className={styles.backBtn} onClick={handleCloseViewer}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Files
          </button>
          <h1 className={styles.viewerTitle}>{selectedFile.description || selectedFile.originalName}</h1>
          <div className={styles.viewerRight}>
            <Lock size={14} style={{ marginRight: '4px' }} />
            <span className={styles.protectedBadge}>Protected Document</span>
          </div>
        </div>
        <div className={styles.viewerContent}>
          {selectedFile.mimeType === 'application/pdf' && (
            <div className={styles.pdfWrapper}>
              <iframe src={`${getViewUrl(selectedFile.id)}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0`} className={styles.pdfFrame} title={selectedFile.description || selectedFile.originalName} />
              <div className={styles.pdfClickShield} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }} onClick={(e) => { e.preventDefault(); e.stopPropagation() }} />
              <div className={styles.pdfWatermark}>{Array.from({ length: 12 }).map((_, i) => (<span key={i} className={styles.watermarkText}>{getWatermarkText()}</span>))}</div>
            </div>
          )}
          {selectedFile.mimeType === 'image/png' && (
            <div className={`${styles.imageContainer} ${zoomed ? styles.imageContainerZoomed : ''}`} onClick={() => setZoomed(!zoomed)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}>
              <div className={styles.imageWrapper} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}>
                <img src={getViewUrl(selectedFile.id)} alt={selectedFile.description || selectedFile.originalName} className={`${styles.viewerImage} ${zoomed ? styles.viewerImageZoomed : ''}`} draggable={false} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }} onDragStart={(e) => { e.preventDefault(); return false }} />
                <div className={styles.imageWatermark}>{Array.from({ length: 6 }).map((_, i) => (<span key={i} className={styles.watermarkText}>{getWatermarkText()}</span>))}</div>
              </div>
              {!zoomed && <div className={styles.zoomHint}><ZoomIn size={14} /> Click to zoom in</div>}
              {zoomed && <div className={styles.zoomHint}><ZoomIn size={14} /> Click to zoom out</div>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className={styles.filesPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <FileText size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Class Study Materials
            </h1>
            <p className={styles.pageSubtitle}>View protected PDFs and PNG study materials shared by your teachers</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={fetchClasses}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : (classes || []).length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Enrolled</h3>
            <p className={styles.emptyText}>You are not enrolled in any active classes yet.</p>
          </div>
        ) : (
          <div className={styles.contentLayout}>
            {/* Class Sidebar Selector */}
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {(classes || []).map(cls => (
                  <button
                    key={cls.id}
                    className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <BookOpen size={16} />
                    <div className={styles.classItemInfo}>
                      <p className={styles.classItemName}>{cls.name}</p>
                      <p className={styles.classItemSubject}>{cls.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Pane */}
            <div className={styles.mainContent}>
              <div className={styles.filesSection}>
                <div className={styles.filesSectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <FileText size={18} style={{ marginRight: '6px' }} />
                    {selectedClass?.name} <span className={styles.fileCount}>{(files || []).length} files</span>
                  </h2>

                  {(files || []).length > 0 && (
                    <div className={styles.fileSearchBox}>
                      <Search size={16} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Filter study files..."
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                        className={styles.fileSearchInput}
                      />
                    </div>
                  )}
                </div>

                {filesLoading ? (
                  <SkeletonGrid count={3} type="card" />
                ) : filteredFiles.length === 0 ? (
                  <EmptyState
                    icon="files"
                    title={fileSearch ? 'No Study Files Found' : 'No Files Uploaded Yet'}
                    message={fileSearch ? 'Try typing a different filename or keyword' : `Your instructor has not uploaded any study materials to ${selectedClass?.name} yet.`}
                    size="sm"
                  />
                ) : (
                  <div className={styles.filesGrid}>
                    {filteredFiles.map(file => (
                      <button
                        key={file.id}
                        className={styles.fileCard}
                        onClick={() => handleViewFile(file)}
                      >
                        <div className={styles.fileCardIcon}>
                          {file.mimeType === 'application/pdf' ? <FileText size={40} color="#c64545" /> : <Image size={40} color="#5db8a6" />}
                        </div>
                        <div className={styles.fileCardInfo}>
                          <p className={styles.fileCardName}>{file.description || file.originalName}</p>
                          <p className={styles.fileCardMeta}>
                            <span className={file.mimeType === 'application/pdf' ? styles.pdfPill : styles.pngPill}>
                              {file.mimeType === 'application/pdf' ? 'PDF' : 'PNG'}
                            </span> • {file.formattedSize}
                          </p>
                          <p className={styles.fileCardDate}>{formatDate(file.uploadedAt)}</p>
                        </div>
                        <div className={styles.viewBtn}>
                          <Eye size={14} style={{ marginRight: '4px' }} /> Preview
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentFiles