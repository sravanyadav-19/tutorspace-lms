import app from './app.js'
import dotenv from 'dotenv'
import { connectWithRetry, disconnectGracefully } from './lib/prisma.js'

dotenv.config()

const PORT = process.env.PORT || 5000

// ---- Start server ----
const server = app.listen(PORT, async () => {
  console.log('================================')
  console.log('🚀 TutorSpace Backend Running!')
  console.log('================================')
  console.log(`📡 Port:     ${PORT}`)
  console.log(`🌍 Mode:     ${process.env.NODE_ENV}`)
  console.log(`🔗 URL:      http://localhost:${PORT}`)
  console.log(`❤️  Health:   http://localhost:${PORT}/health`)
  console.log('================================')
  console.log('📅 Day 3/50 - Backend Ready!')
  console.log('================================')

  // Connect to the database with retry logic
  try {
    await connectWithRetry()
  } catch (error) {
    console.error('❌ Failed to connect to database. Exiting...')
    process.exit(1)
  }
})

// ---- Graceful shutdown (Render sends SIGTERM on deploy/restart) ----
async function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`)

  server.close(async () => {
    console.log('   HTTP server closed')
    await disconnectGracefully()
    console.log('   Goodbye 👋')
    process.exit(0)
  })

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('   ⚠️  Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
