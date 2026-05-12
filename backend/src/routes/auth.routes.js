import express from 'express'
import { 
  register, 
  login, 
  verifyEmail,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js'

const router = express.Router()

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/login
router.post('/login', login)

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail)

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword)

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword)

export default router
