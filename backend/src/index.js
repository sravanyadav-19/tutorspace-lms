import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import classRoutes from './routes/class.routes.js'
import announcementRoutes from './routes/announcement.routes.js'
import fileRoutes from './routes/file.routes.js'
import quizRoutes from './routes/quiz.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/quizzes', quizRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  })
})

app.listen(PORT, () => {
  console.log(`TutorSpace Backend running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
})
