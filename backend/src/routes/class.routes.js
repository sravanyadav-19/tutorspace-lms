import express from 'express'
import { 
  getAllClasses, 
  getTeacherClasses,
  getClassById,
  createClass, 
  updateClass, 
  deleteClass,
  enrollStudent,
  removeStudent
} from '../controllers/class.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// Get all classes (Admin only)
router.get('/', authenticate, authorize(['admin']), getAllClasses)

// Get teacher's classes (Teacher only)
router.get('/teacher', authenticate, authorize(['teacher']), getTeacherClasses)

// Get single class
router.get('/:id', authenticate, getClassById)

// Create new class (Admin only)
router.post('/', authenticate, authorize(['admin']), createClass)

// Update class (Admin only)
router.put('/:id', authenticate, authorize(['admin']), updateClass)

// Delete class (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), deleteClass)

// Enroll student (Admin only)
router.post('/:classId/enroll/:userId', authenticate, authorize(['admin']), enrollStudent)

// Remove student (Admin only)
router.delete('/:classId/enroll/:userId', authenticate, authorize(['admin']), removeStudent)

export default router
