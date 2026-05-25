import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  verifyEmail
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../schemas/validation.schema.js'

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.'
  }
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/profile', authenticate, getProfile)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword)
router.get('/verify-email/:token', verifyEmail)

export default router
