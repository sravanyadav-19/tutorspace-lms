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
// Trust exactly one hop — Render sits a single reverse proxy
// in front of the app. Using a literal number (1) satisfies
// express-rate-limit v8's strict trust-proxy validation,
// which rejects `true` (a boolean) as too permissive and
// throws ERR_ERL_PERMISSIVE_TRUST_PROXY on first request.
app.set('trust proxy', 1)

// ================================
// CORS — MUST be the very first middleware
// ================================
const allowedOrigins = [
  'https://tutorspace-lms.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',   // Vite default
]

/**
 * Write a CORS-compliant Access-Control-Allow-Origin header on `res`
 * ONLY if the request's `Origin` header matches an allowed origin.
 *
 * Per the CORS spec, `Access-Control-Allow-Origin: *` cannot be
 * combined with `Access-Control-Allow-Credentials: true` — the
 * browser will reject the response. So we never fall back to `*`;
 * we either echo back a real, allow-listed origin, or we write
 * nothing at all (and the browser blocks the response client-side,
 * which is the correct behavior for an unknown origin).
 */
function setCorsHeader(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Reject gracefully instead of throwing — throwing routes
    // through Express's default error handler and returns a bare
    // 500 with no CORS headers, which the browser reports as
    // "No 'Access-Control-Allow-Origin' header is present".
    // `callback(null, false)` tells the cors middleware to refuse
    // the request with no CORS headers — the browser then blocks
    // the response client-side, which is the correct outcome.
    console.warn(`🚫 CORS blocked origin: ${origin}`)
    return callback(null, false)
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
  max: 5000,
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
  // Apply CORS only for allow-listed origins (never '*' with credentials)
  setCorsHeader(req, res)

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

  // Apply CORS only for allow-listed origins (never '*' with credentials)
  setCorsHeader(req, res)

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