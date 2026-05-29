import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, BookOpen, RefreshCw, Eye, Image, Lock, ZoomIn, ArrowLeft, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
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
  const token = localStorage.getItem('tutorspace_token')

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass) { fetchFiles(selectedClass.id); setSelectedFile(null) } }, [selectedClass])

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
    try { setLoading(true); const res = await classAPI.getStudentClasses(); const sc = res.data.data.classes; setClasses(sc); if (sc.length > 0) setSelectedClass(sc[0]) }
    catch (err) { setError('Failed to load classes') }
    finally { setLoading(false) }
  }

  const fetchFiles = async (classId) => {
    try { setFilesLoading(true); const res = await fileAPI.getClassFiles(classId); setFiles(res.data.data.files) }
    catch (err) { setFiles([]) }
    finally { setFilesLoading(false) }
  }

  const handleViewFile = (file) => { setSelectedFile(file); setZoomed(false) }
  const handleCloseViewer = () => { setSelectedFile(null); setZoomed(false); navigate('/student/files') }
  const getViewUrl = (fileId) => `http://localhost:5000/api/files/view/${fileId}?token=${token}`
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getWatermarkText = () => {
    const name = user?.name || 'Student'
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return `${name} • ${date} • TutorSpace`
  }

  if (selectedFile) {
    return (
      <div className={styles.fullPageViewer} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}>
        <div className={styles.viewerHeader}>
          <button className={styles.backBtn} onClick={handleCloseViewer}><ArrowLeft size={16} /> Back</button>
          <h1 className={styles.viewerTitle}>{selectedFile.description || selectedFile.originalName}</h1>
          <div className={styles.viewerRight}><Lock size={14} /><span>Protected</span></div>
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
              {!zoomed && <div className={styles.zoomHint}><ZoomIn size={14} /> Click to zoom</div>}
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
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><FileText size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Class Files</h1>
            <p className={styles.pageSubtitle}>View files shared by your teachers</p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} color="#6c6a64" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 className={styles.emptyTitle}>No Classes Found</h3><p className={styles.emptyText}>You are not enrolled in any classes yet.</p>
          </div>
        ) : (
          <div className={styles.contentLayout}>
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {classes.map(cls => (
                  <button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.classItemActive : ''}`} onClick={() => setSelectedClass(cls)}>
                    <BookOpen size={16} />
                    <div className={styles.classItemInfo}><p className={styles.classItemName}>{cls.name}</p><p className={styles.classItemSubject}>{cls.subject}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.mainContent}>
              <div className={styles.filesSection}>
                <div className={styles.filesSectionHeader}><h2 className={styles.sectionTitle}><FileText size={18} style={{ marginRight: '6px' }} /> {selectedClass?.name}</h2><span className={styles.fileCount}>{files.length} files</span></div>
                {filesLoading ? <SkeletonGrid count={3} type="card" /> : files.length === 0 ? (
                  <div className={styles.emptyFiles}>
                    <FileText size={32} color="#6c6a64" style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <h3 className={styles.emptyTitle}>No Files Yet</h3><p className={styles.emptyText}>Your teacher hasn't uploaded any files yet.</p>
                  </div>
                ) : (
                  <div className={styles.filesGrid}>
                    {files.map(file => (
                      <button key={file.id} className={styles.fileCard} onClick={() => handleViewFile(file)}>
                        <div className={styles.fileCardIcon}>{file.mimeType === 'application/pdf' ? <FileText size={48} color="#c64545" /> : <Image size={48} color="#5db8a6" />}</div>
                        <div className={styles.fileCardInfo}><p className={styles.fileCardName}>{file.description || file.originalName}</p><p className={styles.fileCardMeta}>{file.mimeType === 'application/pdf' ? 'PDF' : 'PNG'} • {file.formattedSize}</p><p className={styles.fileCardDate}>{formatDate(file.uploadedAt)}</p></div>
                        <div className={styles.viewBtn}><Eye size={14} style={{ marginRight: '4px' }} /> View</div>
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