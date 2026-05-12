import express from 'express'
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// GET /api/users - Admin only
router.get('/', authorize('admin'), getAllUsers)

// GET /api/users/:id
router.get('/:id', getUserById)

// PUT /api/users/:id
router.put('/:id', updateUser)

// DELETE /api/users/:id - Admin only
router.delete('/:id', authorize('admin'), deleteUser)

export default router
