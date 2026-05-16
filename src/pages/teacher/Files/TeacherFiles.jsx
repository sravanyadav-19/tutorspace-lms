import React, { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import Button from '../../../components/shared/Button'
import { classAPI, fileAPI } from '../../../services/api'
import styles from './TeacherFiles.module.css'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => { fetchClasses() }, [])

  useEffect(() => {
    if (selectedClass) fetchFiles(selectedClass.id)
  }, [selectedClass])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await classAPI.getTeacherClasses()
      const teacherClasses = res.data.data.classes
      setClasses(teacherClasses)
      if (teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0])
      }
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
      setFiles(res.data.data.files)
    } catch (err) {
      setFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf' && file.type !== 'image/png') {
        setError('Only PDF and PNG files are allowed')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'image/png') {
        setError('Only PDF and PNG files are allowed')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }
    if (!selectedClass) {
      setError('Please select a class first')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('description', description)

      const res = await fileAPI.uploadFile(selectedClass.id, formData)
      const uploadedFile = res.data.data.file

      setFiles(prev => [uploadedFile, ...prev])
      setSelectedFile(null)
      setDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      setSuccess(`"${uploadedFile.originalName}" uploaded successfully!`)
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return
    try {
      await fileAPI.deleteFile(fileId)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setSuccess(`"${fileName}" deleted successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete file')
    }
  }

  const getFileSize = (file) => {
    if (!file) return ''
    const bytes = file.size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className={styles.filesPage}>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>📄 File Sharing</h1>
            <p className={styles.pageSubtitle}>
              Upload PDF and PNG files for your classes
            </p>
          </div>
          <Button variant="secondary" onClick={fetchClasses}>
            🔄 Refresh
          </Button>
        </div>

        {/* Banners */}
        {success && (
          <div className={styles.successBanner}>✅ {success}</div>
        )}
        {error && (
          <div className={styles.errorBanner}>⚠️ {error}</div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading your classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3 className={styles.emptyTitle}>No Classes Assigned</h3>
            <p className={styles.emptyText}>
              You need to be assigned to a class before uploading files.
            </p>
          </div>
        ) : (
          <div className={styles.contentLayout}>

            {/* Class Selector Sidebar */}
            <div className={styles.classSidebar}>
              <h3 className={styles.sidebarTitle}>Your Classes</h3>
              <div className={styles.classList}>
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    className={`
                      ${styles.classItem}
                      ${selectedClass?.id === cls.id
                        ? styles.classItemActive : ''}
                    `}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <span className={styles.classItemIcon}>📚</span>
                    <div className={styles.classItemInfo}>
                      <p className={styles.classItemName}>{cls.name}</p>
                      <p className={styles.classItemSubject}>{cls.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>

              {/* Upload Section */}
              <div className={styles.uploadSection}>
                <h2 className={styles.sectionTitle}>
                  ⬆️ Upload to {selectedClass?.name}
                </h2>

                {/* File Type Notice */}
                <div className={styles.fileTypeNotice}>
                  <span>📄 PDF</span>
                  <span>and</span>
                  <span>🖼️ PNG</span>
                  <span>files only • Max 10MB</span>
                </div>

                {/* Drop Zone */}
                <div
                  className={`
                    ${styles.dropZone}
                    ${dragOver ? styles.dropZoneActive : ''}
                    ${selectedFile ? styles.dropZoneHasFile : ''}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles.fileInput}
                    onChange={handleFileSelect}
                    accept=".pdf,.png"
                  />

                  {selectedFile ? (
                    <div className={styles.selectedFile}>
                      <div className={styles.selectedFileIcon}>
                        {selectedFile.type === 'application/pdf'
                          ? '📄' : '🖼️'}
                      </div>
                      <div className={styles.selectedFileInfo}>
                        <p className={styles.selectedFileName}>
                          {selectedFile.name}
                        </p>
                        <p className={styles.selectedFileSize}>
                          {getFileSize(selectedFile)} •{' '}
                          {selectedFile.type === 'application/pdf'
                            ? 'PDF Document' : 'PNG Image'}
                        </p>
                      </div>
                      <button
                        className={styles.removeFileBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropZoneContent}>
                      <div className={styles.dropZoneIcons}>
                        <span>📄</span>
                        <span>🖼️</span>
                      </div>
                      <p className={styles.dropZoneText}>
                        Drag & drop a PDF or PNG here, or{' '}
                        <span className={styles.browseLink}>browse</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Description Input */}
                <div className={styles.descriptionField}>
                  <label className={styles.descriptionLabel}>
                    File Name / Description
                  </label>
                  <input
                    type="text"
                    className={styles.descriptionInput}
                    placeholder="e.g. Chapter 5 Notes, Assignment 2 Guide..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Upload Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? '⏳ Uploading...' : '⬆️ Upload File'}
                </Button>
              </div>

              {/* Files List */}
              <div className={styles.filesSection}>
                <h2 className={styles.sectionTitle}>
                  📁 Uploaded Files
                  <span className={styles.fileCount}>
                    {files.length} files
                  </span>
                </h2>

                {filesLoading ? (
                  <div className={styles.loadingState}>
                    <p>Loading files...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className={styles.emptyFiles}>
                    <div className={styles.emptyIcon}>📭</div>
                    <p className={styles.emptyText}>
                      No files uploaded yet.
                    </p>
                  </div>
                ) : (
                  <div className={styles.filesList}>
                    {files.map(file => (
                      <div key={file.id} className={styles.fileCard}>
                        <div className={styles.fileIcon}>
                          {file.mimeType === 'application/pdf'
                            ? '📄' : '🖼️'}
                        </div>
                        <div className={styles.fileInfo}>
                          <p className={styles.fileName}>
                            {file.originalName}
                          </p>
                          <div className={styles.fileMeta}>
                            <span>{file.formattedSize}</span>
                            <span>•</span>
                            <span>
                              {file.mimeType === 'application/pdf'
                                ? 'PDF' : 'PNG'}
                            </span>
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                            {file.description && (
                              <>
                                <span>•</span>
                                <span className={styles.fileDescription}>
                                  {file.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(
                            file.id,
                            file.originalName
                          )}
                        >
                          🗑️ Delete
                        </button>
                      </div>
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

export default TeacherFiles
