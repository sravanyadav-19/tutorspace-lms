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

function getResourceType(mimeType) {
  return mimeType?.startsWith('image/') ? 'image' : 'raw'
}

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
      userId_classId: { userId, classId: file.classId }
    }
  })

  if (enrollment) {
    return { authorized: true, classId: file.classId }
  }

  return { authorized: false, classId: file.classId }
}

/**
 * Extract the Cloudinary public_id from a Cloudinary URL.
 * For 'raw' resources (PDFs), the extension MUST be preserved.
 * For 'image' resources (PNGs), the extension is stripped (Cloudinary convention).
 *
 * URL: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/public_id.ext
 * Returns: folder/public_id (with or without extension based on resourceType)
 */
function extractPublicIdFromUrl(url, resourceType) {
  try {
    const cleanUrl = url.split('?')[0]
    const parts = cleanUrl.split('/upload/')
    if (parts.length < 2) return null
    const afterUpload = parts[1]
    const afterVersion = afterUpload.replace(/^v\d+\//, '')
    // For 'image' resources, strip the extension (Cloudinary manages format separately).
    // For 'raw' resources (PDFs), keep the extension — Cloudinary requires it.
    if (resourceType === 'image') {
      return afterVersion.replace(/\.[^.]+$/, '')
    }
    return afterVersion
  } catch {
    return null
  }
}

function getSignedCloudinaryUrl(fileRecord, options = {}) {
  const resourceType = getResourceType(fileRecord.mimeType)
  const publicId = extractPublicIdFromUrl(fileRecord.filePath, resourceType) || fileRecord.filename

  return cloudinary.url(publicId, {
    secure: true,
    type: 'upload',
    resource_type: resourceType,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...options
  })
}

async function deleteFileFromStorage(fileRecord) {
  if (storageProvider === 'cloudinary' && fileRecord.filePath) {
    const resourceType = getResourceType(fileRecord.mimeType)
    const publicId = extractPublicIdFromUrl(fileRecord.filePath, resourceType) || fileRecord.filename
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      })
    } catch (e) {
      console.warn('Cloudinary delete warning:', e.message)
    }
  } else {
    if (fs.existsSync(fileRecord.filePath)) {
      fs.unlinkSync(fileRecord.filePath)
    }
  }
}

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

    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    const file = await prisma.file.create({
      data: {
        filename: req.file.filename || path.basename(req.file.path),
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
    console.error('Upload file error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    })
  }
}

export const getClassFiles = async (req, res) => {
  try {
    const { classId } = req.params

    const files = await prisma.file.findMany({
      where: { classId: parseInt(classId) },
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
      const signedUrl = getSignedCloudinaryUrl(file, { attachment: file.originalName })
      return res.redirect(signedUrl)
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
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

    await deleteFileFromStorage(file)
    await prisma.file.delete({ where: { id: parseInt(fileId) } })

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

export const getTeacherFiles = async (req, res) => {
  try {
    const teacherId = req.user.id

    const files = await prisma.file.findMany({
      where: { uploaderId: teacherId },
      include: {
        class: { select: { id: true, name: true, subject: true } },
        uploader: { select: { id: true, name: true } }
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

export const getStudentFiles = async (req, res) => {
  try {
    const studentId = req.user.id

    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: studentId },
      select: { classId: true }
    })

    const classIds = enrollments.map(e => e.classId)

    const files = await prisma.file.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: { select: { id: true, name: true, subject: true } },
        uploader: { select: { id: true, name: true } }
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
      const signedUrl = getSignedCloudinaryUrl(file)
      return res.redirect(signedUrl)
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      })
    }

    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`)
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'self'")

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