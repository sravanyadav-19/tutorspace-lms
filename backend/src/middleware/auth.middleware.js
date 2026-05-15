import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 AUTHENTICATE MIDDLEWARE CALLED')
    console.log('📍 Headers:', req.headers.authorization ? 'Present' : 'Missing')

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header')
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    const token = authHeader.substring(7)
    console.log('🔑 Token length:', token.length)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('📝 Decoded token:', decoded)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    })

    console.log('👤 Database user:', user ? {
      id: user.id,
      email: user.email,
      role: user.role.name,
      status: user.status
    } : 'NOT FOUND')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      })
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please wait for admin approval.'
      })
    }

    req.user = user
    console.log('✅ User set on request')
    next()

  } catch (error) {
    console.log('💥 Auth middleware error:', error.message)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      })
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🛡️ AUTHORIZE MIDDLEWARE CALLED')
    console.log('🔍 Required roles:', roles)
    console.log('👤 User role:', req.user?.role?.name)
    console.log('👤 User object:', req.user ? 'Present' : 'Missing')

    if (!req.user) {
      console.log('❌ No user on request')
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      })
    }

    if (!roles.includes(req.user.role.name)) {
      console.log('❌ Role check failed:', {
        required: roles,
        actual: req.user.role.name
      })
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      })
    }

    console.log('✅ Authorization successful')
    next()
  }
}
