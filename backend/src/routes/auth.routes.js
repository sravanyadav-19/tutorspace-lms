import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  getProfile
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.'
  }
})

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/profile', authenticate, getProfile)

export default router
