import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

// Create upload directory if it doesn't exist
const uploadDir = 'uploads/files'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4()
    const extension = path.extname(file.originalname)
    const filename = `${uniqueId}${extension}`
    cb(null, filename)
  }
})

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(
      'Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, Images, ZIP'
    ), false)
  }
}

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files at once
  }
})

export default upload
