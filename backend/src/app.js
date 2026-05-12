import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import classRoutes from './routes/class.routes.js'

// Load environment variables
dotenv.config()

const app = express()

// ================================
// MIDDLEWARE
// ================================

// CORS - Allow frontend to communicate
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))

// Parse URL encoded bodies
app.use(express.urlencoded({ extended: true }))

// ================================
// HEALTH CHECK ROUTE
// ================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TutorSpace API is running!',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    day: '3/50'
  })
})

// ================================
// API ROUTES
// ================================
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/classes', classRoutes)

// ================================
// 404 HANDLER
// ================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// ================================
// ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack 
    })
  })
})

export default app
