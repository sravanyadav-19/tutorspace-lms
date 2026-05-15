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

router.get('/', authenticate, authorize('admin'), getAllClasses)
router.get('/teacher', authenticate, authorize('teacher'), getTeacherClasses)
router.get('/:id', authenticate, getClassById)
router.post('/', authenticate, authorize('admin'), createClass)
router.put('/:id', authenticate, authorize('admin'), updateClass)
router.delete('/:id', authenticate, authorize('admin'), deleteClass)
router.post('/:classId/enroll/:userId', authenticate, authorize('admin'), enrollStudent)
router.delete('/:classId/enroll/:userId', authenticate, authorize('admin'), removeStudent)

export default router
