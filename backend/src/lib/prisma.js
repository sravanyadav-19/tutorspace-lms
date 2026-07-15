// ============================================================
// TutorSpace LMS — Singleton Prisma Client
// ============================================================
// FIXES:
//  1. One shared PrismaClient instance (not 7 separate ones)
//  2. Connection pool tuned for Render / serverless Postgres
//  3. Retry logic for stale/dropped connections
//  4. Graceful lifecycle (connect on boot, disconnect on shutdown)
// ============================================================

import { PrismaClient } from '@prisma/client'

// Prevent multiple instances in development (hot-reload / Next.js)
const globalForPrisma = globalThis

/**
 * Build the datasource URL with optimal connection-pool params.
 *
 * - connection_limit=1   → safe for Render free-tier & pooled Postgres
 *                          (Neon, Supabase, Railway connection pools)
 * - pool_timeout=10      → seconds to wait for a free connection
 * - connect_timeout=10   → seconds to wait for initial TCP connect
 * - pg bouncer=true      → required ONLY if your DATABASE_URL points to
 *                          a PgBouncer / Neon pooled endpoint (port 6543).
 *                          Comment the line in/out as needed.
 */
function buildDatasourceUrl() {
  const url = process.env.DATABASE_URL
  if (!url) return url

  // If the URL already has query params, don't duplicate them
  if (url.includes('?')) return url

  // Append pool-tuning params
  const params = new URLSearchParams({
    connection_limit: '1',
    pool_timeout: '10',
    connect_timeout: '10',
    // pgbouncer: 'true',         // ← Uncomment if using Neon/Supabase pooler
  })

  return `${url}?${params.toString()}`
}

/**
 * Create (or reuse) the singleton PrismaClient.
 */
function createPrismaClient() {
  const datasourceUrl = buildDatasourceUrl()

  const client = new PrismaClient({
    datasourceUrl,
    log:
      process.env.NODE_ENV === 'production'
        ? ['warn', 'error']
        : ['query', 'warn', 'error'],
    errorFormat: 'pretty',
  })

  return client
}

// ---- Singleton export ----
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In dev, keep the instance alive across hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ---- Helper: connect with retry ----
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/**
 * Connect to the database with automatic retries.
 * Handles the "Server has closed the connection" scenario
 * by re-establishing the connection up to MAX_RETRIES times.
 */
export async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect()
      console.log(`✅ Database connected (attempt ${attempt})`)
      return true
    } catch (error) {
      console.warn(
        `⚠️  Database connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error.message
      )
      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      } else {
        console.error('❌ All database connection attempts failed.')
        throw error
      }
    }
  }
}

/**
 * Gracefully disconnect from the database.
 */
export async function disconnectGracefully() {
  try {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected gracefully')
  } catch (error) {
    console.error('Error during database disconnect:', error.message)
  }
}

export default prisma
