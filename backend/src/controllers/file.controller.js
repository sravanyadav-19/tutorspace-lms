import { prisma } from '../lib/prisma.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import cloudinary from '../config/cloudinary.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storageProvider = process.env.STORAGE_PROVIDER || 'local'

// Get file icon based on mime type
const getFileIcon = (mimeType) => {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
  if (mimeType === 'text/plain') return '📃'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
  return '📁'
}

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check that the requesting user is authorized to access a file.
 * Allowed if:
 *   - user is admin, OR
 *   - user is enrolled in the file's class (teacher or student), OR
 *   - user is the uploader of the file
 */
async function checkFileAccess(userId, userRole, fileId) {
  if (userRole === 'admin') {
    return { authorized: true, classId: null }
  }

  const file = await prisma.file.findUnique({
    where: { id: parseInt(fileId) },
    select: { classId: true, uploaderId: true }
  })

  if (!file) {
    return { authorized: false, classId: null }
  }

  if (file.uploaderId === userId) {
    return { authorized: true, classId: file.classId }
  }

  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      userId_classId: {
        userId,
        classId: file.classId
      }
    }
  })

  if (enrollment) {
    return { authorized: true, classId: file.classId }
  }

  return { authorized: false, classId: file.classId }
}

/**
 * Delete file from storage (cloudinary or local disk).
 */
async function deleteFileFromStorage(filePath) {
  if (storageProvider === 'cloudinary') {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/tutorspace/files/public_id.ext
    const parts = filePath.split('/')
    const publicIdWithExt = parts[parts.length - 1]
    const publicId = `tutorspace/files/${path.parse(publicIdWithExt).name}`
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
    } catch (e) {
      console.warn('Cloudinary delete warning:', e.message)
    }
  } else {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

// Upload file (Teacher only)
export const uploadFile = async (req, res) => {
  try {
    const { classId } = req.params
    const { description } = req.body
    const teacherId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!classExists) {
      // Delete uploaded file if class not found
      if (req.file.path) {
        await deleteFileFromStorage(req.file.path)
      }
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    // Determine the file path/URL to store
    // Cloudinary provides req.file.path as the secure URL
    // Local disk provides req.file.path as the local filesystem path
    let filePath = req.file.path
    let fileSize = req.file.size

    // For Cloudinary, also store the public_id for later deletion
    let cloudinaryPublicId = null
    if (storageProvider === 'cloudinary' && req.file.filename) {
      cloudinaryPublicId = req.file.filename
    }

    // Save file record to database
    const file = await prisma.file.create({
      data: {
        filename: req.file.filename || path.basename(filePath),
        originalName: req.file.originalname,
        filePath,
        description: description?.trim() || null,
        fileSize,
        mimeType: req.file.mimetype,
        uploaderId: teacherId,
        classId: parseInt(classId)
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: {
          ...file,
          icon: getFileIcon(file.mimeType),
          formattedSize: formatFileSize(file.fileSize)
        }
      }
    })
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && req.file.path) {
      await deleteFileFromStorage(req.file.path)
    }
    console.error('Upload file error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    })
  }
}

// Get files for a class
export const getClassFiles = async (req, res) => {
  try {
    const { classId } = req.params

    const files = await prisma.file.findMany({
      where: {
        classId: parseInt(classId)
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    const filesWithMeta = files.map(file => ({
      ...file,
      icon: getFileIcon(file.mimeType),
      formattedSize: formatFileSize(file.fileSize)
    }))

    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: { files: filesWithMeta }
    })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    })
  }
}

// Download file
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const access = await checkFileAccess(userId, userRole, fileId)
    if (!access.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this file'
      })
    }

    if (storageProvider === 'cloudinary') {
      // Redirect to Cloudinary URL for download
      // Add fl_attachment flag to force download
      const separator = file.filePath.includes('?') ? '&' : '?'
      const downloadUrl = `${file.filePath}${separator}fl_attachment&filename=${encodeURIComponent(file.originalName)}`
      return res.redirect(downloadUrl)
    }

    // Local disk fallback
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`
    )
    res.setHeader('Content-Type', file.mimeType)

    const fileStream = fs.createReadStream(file.filePath)
    fileStream.pipe(res)

  } catch (error) {
    console.error('Download file error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    })
  }
}

// Delete file (Teacher who uploaded it)
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user.id

    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    if (file.uploaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own files'
      })
    }

    // Delete from storage (Cloudinary or local disk)
    await deleteFileFromStorage(file.filePath)

    // Delete file record from database
    await prisma.file.delete({
      where: { id: parseInt(fileId) }
    })

    res.status(200).json({
      success: true,
      message: `File "${file.originalName}" deleted successfully`
    })
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    })
  }
}

// Get all files for teacher's classes
export const getTeacherFiles = async (req, res) => {
  try {
    const teacherId = req.user.id

    const files = await prisma.file.findMany({
      where: {
        uploaderId: teacherId
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    const filesWithMeta = files.map(file => ({
      ...file,
      icon: getFileIcon(file.mimeType),
      formattedSize: formatFileSize(file.fileSize)
    }))

    res.status(200).json({
      success: true,
      message: 'Teacher files retrieved successfully',
      data: { files: filesWithMeta }
    })
  } catch (error) {
    console.error('Get teacher files error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve teacher files'
    })
  }
}

// Get all files for student's enrolled classes
export const getStudentFiles = async (req, res) => {
  try {
    const studentId = req.user.id

    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: studentId },
      select: { classId: true }
    })

    const classIds = enrollments.map(e => e.classId)

    const files = await prisma.file.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    const filesWithMeta = files.map(file => ({
      ...file,
      icon: getFileIcon(file.mimeType),
      formattedSize: formatFileSize(file.fileSize)
    }))

    res.status(200).json({
      success: true,
      message: 'Student files retrieved successfully',
      data: { files: filesWithMeta }
    })
  } catch (error) {
    console.error('Get student files error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student files'
    })
  }
}

// View file inline (no download) - for students
export const viewFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    const access = await checkFileAccess(userId, userRole, fileId)
    if (!access.authorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this file'
      })
    }

    if (storageProvider === 'cloudinary') {
      // Redirect to Cloudinary URL for inline viewing
      return res.redirect(file.filePath)
    }

    // Local disk fallback
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`
    )
    res.setHeader('Content-Type', file.mimeType)

    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'"
    )

    const fileStream = fs.createReadStream(file.filePath)
    fileStream.pipe(res)

  } catch (error) {
    console.error('View file error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to view file'
    })
  }
}