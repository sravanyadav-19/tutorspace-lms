import express from 'express'
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticate, authorize('admin'), getAllUsers)
router.get('/:id', authenticate, getUserById)
router.put('/:id', authenticate, authorize('admin'), updateUser)
router.delete('/:id', authenticate, authorize('admin'), deleteUser)

export default router
