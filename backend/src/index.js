import app from './app.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
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
})
