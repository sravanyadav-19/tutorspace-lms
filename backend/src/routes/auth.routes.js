import express from 'express'
import { login, register, getProfile } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Public routes
router.post('/login', login)
router.post('/register', register)

// Protected routes
router.get('/profile', authenticate, getProfile)

export default router
