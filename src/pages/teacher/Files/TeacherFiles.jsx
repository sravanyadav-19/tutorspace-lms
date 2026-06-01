import React, { useState, useEffect, useRef } from 'react'
import { FileText, Image, BookOpen, RefreshCw, Upload, Eye, Trash2, X, ZoomIn, Target, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import ConfirmModal from '../../../components/shared/ConfirmModal'
import { classAPI, fileAPI } from '../../../services/api'
import styles from './TeacherFiles.module.css'
import { SkeletonGrid, SkeletonCard } from '../../../components/shared/Skeleton/Skeleton'
import EmptyState from '../../../components/shared/EmptyState'

const TeacherFiles = () => {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filesLoading, setFilesLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [zoomed, setZoomed] = useState(false)
  const fileInputRef = useRef(null)
  const token = localStorage.getItem('tutorspace_token')
  const [confirmModal, setConfirmModal] = useState({ open: false, fileId: null, fileName: '' })
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (selectedClass) fetchFiles(selectedClass.id) }, [selectedClass])

  const fetchClasses = async () => {
    try { setLoading(true); const res = await classAPI.getTeacherClasses(); const teacherClasses = res.data.data.classes; setClasses(teacherClasses); if (teacherClasses.length > 0) setSelectedClass(teacherClasses[0]) }
    catch (err) { setError('Failed to load classes') }
    finally { setLoading(false) }
  }

  const fetchFiles = async (classId) => {
    try { setFilesLoading(true); const res = await fileAPI.getClassFiles(classId); setFiles(res.data.data.files) }
    catch (err) { setFiles([]) }
    finally { setFilesLoading(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'image/png') { setError('Only PDF and PNG files are allowed'); return }
      setSelectedFile(file); setError('')
    }
  }

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'image/png') { setError('Only PDF and PNG files are allowed'); return }
      setSelectedFile(file); setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file first'); return }
    if (!selectedClass) { setError('Please select a class first'); return }
    setUploading(true); setError(''); setSuccess('')
    try {
      const formData = new FormData(); formData.append('file', selectedFile); formData.append('description', description)
      const res = await fileAPI.uploadFile(selectedClass.id, formData)
      const uploadedFile = res.data.data.file
      setFiles(prev => [uploadedFile, ...prev]); setSelectedFile(null); setDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess(`"${uploadedFile.originalName}" uploaded successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setError(err.response?.data?.message || 'Failed to upload file') }
    finally { setUploading(false) }
  }

  const promptDelete = (fileId, fileName) => setConfirmModal({ open: true, fileId, fileName })

  const handleDelete = async () => {
    const { fileId, fileName } = confirmModal
    if (!fileId) return
    setDeleting(fileId)
    try { await fileAPI.deleteFile(fileId); setFiles(prev => prev.filter(f => f.id !== fileId)); setSuccess(`"${fileName}" deleted successfully!`); setTimeout(() => setSuccess(''), 3000) }
    catch (err) { setError('Failed to delete file') }
    finally { setDeleting(null); setConfirmModal({ open: false, fileId: null, fileName: '' }) }
  }

  const handlePreview = (file) => { setPreviewFile(file); setZoomed(false) }
  const handleClosePreview = () => { setPreviewFile(null); setZoomed(false) }

  const getViewUrl = (fileId) => `http://localhost:5000/api/files/view/${fileId}?token=${token}`

  const getFileSize = (file) => {
    if (!file) return ''
    const bytes = file.size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  if (previewFile) {
    return (
      <div className={styles.fullPageViewer}>
        <div className={styles.viewerHeader}>
          <button className={styles.backBtn} onClick={handleClosePreview}><ArrowLeft size={18} /> Back</button>
          <h1 className={styles.viewerTitle}>{previewFile.description || previewFile.originalName}</h1>
          <div className={styles.viewerRight}><Target size={16} /><span>Teacher Preview</span></div>
        </div>
        <div className={styles.viewerContent}>
          {previewFile.mimeType === 'application/pdf' && <iframe src={`${getViewUrl(previewFile.id)}#toolbar=1&navpanes=1&scrollbar=1`} className={styles.pdfFrame} title={previewFile.description || previewFile.originalName} />}
          {previewFile.mimeType === 'image/png' && (
            <div className={`${styles.imageContainer} ${zoomed ? styles.imageContainerZoomed : ''}`} onClick={() => setZoomed(!zoomed)}>
              <img src={getViewUrl(previewFile.id)} alt={previewFile.description || previewFile.originalName} className={`${styles.viewerImage} ${zoomed ? styles.viewerImageZoomed : ''}`} />
              {!zoomed && <div className={styles.zoomHint}><ZoomIn size={14} /> Click to zoom</div>}
              {zoomed && <div className={styles.zoomHint}><ZoomIn size={14} /> Click to zoom out</div>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.filesPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}><FileText size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Files</h1>
            <p className={styles.pageSubtitle}>Upload PDF and PNG files for your classes</p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}><RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh</Button>
        </div>

        {success && <div className={styles.successBanner}>{success}</div>}
        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}

        {loading ? <SkeletonCard /> : classes.length === 0 ? (
          <EmptyState
            icon="classes"
            title="No Classes Assigned"
            message="You need to be assigned to a class before uploading files."
          />
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
              <div className={styles.uploadSection}>
                <h2 className={styles.sectionTitle}><Upload size={18} style={{ marginRight: '6px' }} /> Upload to {selectedClass?.name}</h2>
                <div className={styles.fileTypeNotice}><FileText size={14} color="#c64545" /> PDF <span>and</span> <Image size={14} color="#5db8a6" /> PNG <span>files only • Max 10MB</span></div>
                <div className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${selectedFile ? styles.dropZoneHasFile : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" className={styles.fileInput} onChange={handleFileSelect} accept=".pdf,.png" />
                  {selectedFile ? (
                    <div className={styles.selectedFile}>
                      <div className={styles.selectedFileIcon}>{selectedFile.type === 'application/pdf' ? <FileText size={24} color="#c64545" /> : <Image size={24} color="#5db8a6" />}</div>
                      <div className={styles.selectedFileInfo}><p className={styles.selectedFileName}>{selectedFile.name}</p><p className={styles.selectedFileSize}>{getFileSize(selectedFile)} • {selectedFile.type === 'application/pdf' ? 'PDF Document' : 'PNG Image'}</p></div>
                      <button className={styles.removeFileBtn} onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <div className={styles.dropZoneContent}>
                      <div className={styles.dropZoneIcons}><FileText size={28} /><Image size={28} /></div>
                      <p className={styles.dropZoneText}>Drag & drop a PDF or PNG here, or <span className={styles.browseLink}>browse</span></p>
                    </div>
                  )}
                </div>
                <div className={styles.descriptionField}>
                  <label className={styles.descriptionLabel}>File Name / Description</label>
                  <input type="text" className={styles.descriptionInput} placeholder="e.g. Chapter 5 Notes, Assignment 2 Guide..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <Button variant="primary" size="lg" onClick={handleUpload} loading={uploading} disabled={uploading || !selectedFile}>
                  {uploading ? 'Uploading...' : <><Upload size={16} style={{ marginRight: '6px' }} /> Upload File</>}
                </Button>
              </div>

              <div className={styles.filesSection}>
                <h2 className={styles.sectionTitle}>Uploaded Files <span className={styles.fileCount}>{files.length} files</span></h2>
                {filesLoading ? <SkeletonGrid count={3} type="card" /> : files.length === 0 ? (
                  <EmptyState icon="files" title="No Files Yet" message="No files uploaded yet." size="sm" />
                  ) : (
                  <div className={styles.filesList}>
                    {files.map(file => (
                      <div key={file.id} className={styles.fileCard}>
                        <div className={styles.fileIcon}>{file.mimeType === 'application/pdf' ? <FileText size={48} color="#c64545" /> : <Image size={48} color="#5db8a6" />}</div>
                        <div className={styles.fileInfo}><p className={styles.fileName}>{file.description || file.originalName}</p>
                          <div className={styles.fileMeta}><span>{file.formattedSize}</span><span>•</span><span>{file.mimeType === 'application/pdf' ? 'PDF' : 'PNG'}</span><span>•</span><span>{formatDate(file.uploadedAt)}</span></div>
                        </div>
                        <div className={styles.fileActions}>
                          <button className={styles.previewBtn} onClick={() => handlePreview(file)}><Eye size={14} style={{ marginRight: '4px' }} /> Preview</button>
                          <button className={styles.deleteBtn} onClick={() => promptDelete(file.id, file.originalName)}><Trash2 size={14} style={{ marginRight: '4px' }} /> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, fileId: null, fileName: '' })} onConfirm={handleDelete} title="Delete File" message={`Are you sure you want to delete "${confirmModal.fileName}"? This file will be permanently removed and students will no longer have access.`} confirmLabel="Delete File" confirmVariant="danger" loading={!!deleting} />
      </div>
    </DashboardLayout>
  )
}

export default TeacherFiles