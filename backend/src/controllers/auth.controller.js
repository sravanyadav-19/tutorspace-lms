import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import {
  generateAccessToken,
  generateRandomToken
} from '../utils/jwt.utils.js'
import {
  sendVerificationEmail,
  sendPasswordResetEmail
} from '../utils/email.utils.js'

// ================================
// REGISTER
// POST /api/auth/register
// ================================
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, name, and role'
      })
    }

    // Validate role
    const validRoles = ['student']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be student'
      })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login.'
      })
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    // Get role from database
    const userRole = await prisma.role.findUnique({
      where: { name: role }
    })

    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      })
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Generate email verification token
    const emailVerifyToken = generateRandomToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        roleId: userRole.id,
        status: 'pending',
        emailVerified: false,
        emailVerifyToken
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        role: {
          select: { name: true }
        }
      }
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, name, emailVerifyToken)
    } catch (emailError) {
      console.error('Email send failed:', emailError.message)
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account. An admin will approve your account shortly.',
      data: { user }
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    })
  }
}

// ================================
// LOGIN
// POST /api/auth/login
// ================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    })

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check account status
    if (user.status === 'pending') {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait.'
      })
    }

    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact admin.'
      })
    }

    // Generate token
    const token = generateAccessToken(user.id, user.role.name)

    // Return user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      status: user.status
    }

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: userData,
        token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    })
  }
}

// ================================
// GET PROFILE
// GET /api/auth/profile
// ================================
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        role: {
          select: { name: true }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Return user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: userData }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    })
  }
}

// ================================
// VERIFY EMAIL
// GET /api/auth/verify-email/:token
// ================================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    // Find user with token
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      })
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null
      }
    })

    res.json({
      success: true,
      message: 'Email verified successfully! Please wait for admin approval.'
    })

  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({
      success: false,
      message: 'Email verification failed. Please try again.'
    })
  }
}

// ================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email'
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = generateRandomToken()
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry
      }
    })

    // Send email
    try {
      await sendPasswordResetEmail(email, user.name, resetToken)
    } catch (emailError) {
      console.error('Reset email failed:', emailError.message)
    }

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'Request failed. Please try again.'
    })
  }
}

// ================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() }
      }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    })

    res.json({
      success: true,
      message: 'Password reset successful! Please login with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.'
    })
  }
}
