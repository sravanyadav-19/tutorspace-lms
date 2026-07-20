import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from './cloudinary.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Determine storage provider from env (default: 'local')
const storageProvider = process.env.STORAGE_PROVIDER || 'local'

// Build storage engine
let storage

if (storageProvider === 'cloudinary') {
  // Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: 'tutorspace/files',
      // Explicitly set resource_type based on mimetype so it matches
      // what file.controller.js's getResourceType() later expects.
      // PDF → 'raw', PNG → 'image'
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      public_id: uuidv4(),
      transformation: [{ quality: 'auto' }]
    })
  })
} else {
  // Local disk storage (fallback)
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'files')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueId = uuidv4()
      const extension = path.extname(file.originalname)
      const filename = `${uniqueId}${extension}`
      cb(null, filename)
    }
  })
}

// File filter - ONLY PDF and PNG
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/png'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF and PNG files are allowed'), false)
  }
}

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
})

export default upload
