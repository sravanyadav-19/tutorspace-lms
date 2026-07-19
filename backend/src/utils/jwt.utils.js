import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Generate access token with role
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { 
      userId,
      role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  )
}

// Verify token
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret)
}

// Generate cryptographically secure random token for email verification
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex')
}