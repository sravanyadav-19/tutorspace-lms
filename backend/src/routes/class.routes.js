import express from 'express'
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent
} from '../controllers/class.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/classes
router.get('/', getAllClasses)

// GET /api/classes/:id
router.get('/:id', getClassById)

// POST /api/classes - Admin only
router.post('/', authorize('admin'), createClass)

// PUT /api/classes/:id - Admin only
router.put('/:id', authorize('admin'), updateClass)

// DELETE /api/classes/:id - Admin only
router.delete('/:id', authorize('admin'), deleteClass)

// POST /api/classes/:id/enroll - Admin only
router.post('/:id/enroll', authorize('admin'), enrollStudent)

export default router
