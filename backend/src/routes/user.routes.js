import express from 'express'
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createTeacher
} from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, authorize('admin'), getAllUsers)
router.post('/create-teacher', authenticate, authorize('admin'), createTeacher)
router.get('/:id', authenticate, getUserById)
router.put('/:id', authenticate, updateUser)
router.delete('/:id', authenticate, authorize('admin'), deleteUser)

export default router
