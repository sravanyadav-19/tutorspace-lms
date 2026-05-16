import express from 'express'
import {
  uploadFile,
  getClassFiles,
  downloadFile,
  viewFile,
  deleteFile,
  getTeacherFiles,
  getStudentFiles
} from '../controllers/file.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'
import upload from '../config/multer.config.js'

const router = express.Router()

// Teacher routes
router.post(
  '/class/:classId/upload',
  authenticate,
  authorize('teacher', 'admin'),
  upload.single('file'),
  uploadFile
)
router.get(
  '/teacher',
  authenticate,
  authorize('teacher', 'admin'),
  getTeacherFiles
)
router.delete(
  '/:fileId',
  authenticate,
  authorize('teacher', 'admin'),
  deleteFile
)

// Student routes
router.get(
  '/student',
  authenticate,
  authorize('student'),
  getStudentFiles
)

// Shared routes
router.get('/class/:classId', authenticate, getClassFiles)
router.get('/download/:fileId', authenticate, downloadFile)
router.get('/view/:fileId', authenticate, viewFile)

export default router
