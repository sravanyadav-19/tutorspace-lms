import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Upload file (Teacher only)
export const uploadFile = async (req, res) => {
  try {
    const { classId } = req.params
    const { description } = req.body
    const teacherId = req.user.id

    // Check if file was uploaded
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
      fs.unlinkSync(req.file.path)
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    // Save file record to database
    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        description: description?.trim() || null,
        fileSize: req.file.size,
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
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
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

    // Add icon and formatted size to each file
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

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    // Set headers for download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`
    )
    res.setHeader('Content-Type', file.mimeType)

    // Stream file to response
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

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check ownership
    if (file.uploaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own files'
      })
    }

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath)
    }

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

    // Get all classes student is enrolled in
    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: studentId },
      select: { classId: true }
    })

    const classIds = enrollments.map(e => e.classId)

    // Get all files from those classes
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

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) }
    })

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    // Set headers to DISPLAY inline (not download)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName}"`
    )
    res.setHeader('Content-Type', file.mimeType)
    
    // Security headers to prevent download
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'"
    )

    // Stream file to response
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
