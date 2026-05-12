import jwt from 'jsonwebtoken'

// Generate access token
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
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

// Generate random token for email verification
export const generateRandomToken = () => {
  return Math.random().toString(36).substring(2) + 
         Date.now().toString(36)
}
