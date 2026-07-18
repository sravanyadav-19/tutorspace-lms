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
import quizRoutes from './routes/quiz.routes.js'

const app = express()

// ================================
// TRUST PROXY (Render uses a reverse proxy)
// Must be set BEFORE any middleware that reads IPs or origins
// ================================
app.set('trust proxy', true)

// ================================
// CORS — MUST be the very first middleware
// ================================
const allowedOrigins = [
  'https://tutorspace-lms.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',   // Vite default
]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    console.warn(`🚫 CORS blocked origin: ${origin}`)
    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400,   // Preflight cache: 24 hours (reduces OPTIONS requests)
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))

// ================================
// RATE LIMITER — skip OPTIONS preflight so CORS never breaks
// ================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
})
app.use(limiter)

// ================================
// HELMET — security headers (after CORS so it never interferes)
// ================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    // Disable legacy X-Frame-Options — it only supports a single
    // 'sameorigin' / 'deny' value and cannot express an allowlist of
    // specific origins. We replace it below with the modern equivalent
    // via CSP frame-ancestors.
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        frameSrc: [
          "'self'",
          'https://tutorspace-lms.vercel.app',
          'http://localhost:3000',
        ],
        // frame-ancestors replaces X-Frame-Options. Restricted to our
        // known frontend origins so file previews load in an <iframe>
        // from the Vercel frontend, while arbitrary third-party sites
        // are still blocked from framing the backend.
        frameAncestors: [
          "'self'",
          'https://tutorspace-lms.vercel.app',
          'http://localhost:3000',
          'http://localhost:5173',
        ],
        connectSrc: [
          "'self'",
          'https://tutorspace-lms.vercel.app',
          'http://localhost:3000',
          'https://tutorspace-lms.onrender.com',
        ],
        mediaSrc: ["'self'"],
      },
    },
  })
)

// ================================
// BODY PARSERS
// ================================
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ================================
// STATIC FILES
// ================================
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../../uploads'))
)

// ================================
// HEALTH CHECK
// ================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TutorSpace LMS Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ================================
// API ROUTES
// ================================
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/quizzes', quizRoutes)

// ================================
// 404 HANDLER — includes CORS headers so preflight never gets a bare 404
// ================================
app.use((req, res) => {
  // Re-apply CORS headers in case they were stripped or never set
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')

  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

// ================================
// GLOBAL ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error('Global error:', err)

  // Ensure CORS headers on error responses too
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB',
    })
  }

  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

export default app