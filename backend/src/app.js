import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import classRoutes from './routes/class.routes.js'
import announcementRoutes from './routes/announcement.routes.js'
import fileRoutes from './routes/file.routes.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.options('*', cors())

// Helmet - explicitly disable X-Frame-Options
app.use(helmet({
  frameguard: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(
  path.join(__dirname, '../../uploads')
))

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TutorSpace LMS Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/files', fileRoutes)

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

app.use((err, req, res, next) => {
  console.error('Global error:', err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB'
    })
  }

  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

export default app
