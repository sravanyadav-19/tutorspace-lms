// ============================================================
// TutorSpace LMS — Singleton Prisma Client (Prisma 5.x)
// ============================================================
// FIXES:
//  1. One shared PrismaClient instance (not 7 separate ones)
//  2. Connection pool tuned for Render / serverless Postgres
//  3. Retry logic for stale/dropped connections (boot + query level)
//  4. Graceful lifecycle (connect on boot, disconnect on shutdown)
// ============================================================
// IMPORTANT — Prisma version note:
// This file targets Prisma 5.22.0 (see backend/package.json).
// In Prisma 5 the correct option for overriding the datasource URL
// at runtime is `datasources: { db: { url } }`. The top-level
// `datasourceUrl` option is a Prisma 6+ API and is silently
// ignored on 5.x — using it would mean our pooling params never
// reach the driver.
// ============================================================

import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Prevent multiple instances in development (hot-reload / Next.js)
const globalForPrisma = globalThis

// Errors that indicate a stale/dropped connection rather than a
// genuine query failure. We retry these; we do NOT retry logic
// errors, validation errors, unique-constraint violations, etc.
const RECONNECTABLE_ERROR_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1003', // Database does not exist
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Timed out fetching a connection from pool
])

const RECONNECTABLE_MESSAGE_FRAGMENTS = [
  'Server has closed the connection',
  'Connection refused',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'socket hang up',
]

function isReconnectableError(err) {
  if (!err) return false
  if (err instanceof Prisma.PrismaClientInitializationError) return true
  if (err instanceof Prisma.PrismaClientRustPanicError) return true
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RECONNECTABLE_ERROR_CODES.has(err.code)
  }
  // For raw network errors the .code lives on the error itself.
  if (err.code && RECONNECTABLE_ERROR_CODES.has(err.code)) return true
  const msg = String(err.message || '')
  return RECONNECTABLE_MESSAGE_FRAGMENTS.some((f) => msg.includes(f))
}

/**
 * Build the datasource URL with optimal connection-pool params.
 *
 * - connection_limit=1   → safe for Render free-tier & pooled Postgres
 *                          (Neon, Supabase, Railway connection pools)
 * - pool_timeout=10      → seconds to wait for a free connection
 * - connect_timeout=10   → seconds to wait for initial TCP connect
 * - sslmode=require      → required for Render Postgres / most hosted PG
 *
 * Preserves any params already present in the input URL (merges with
 * `&` rather than replacing the query string).
 */
export function buildDatasourceUrl() {
  const url = process.env.DATABASE_URL
  if (!url) return url

  // Params we want to ensure are present. If the URL already has
  // any of these we leave them alone; otherwise we add them.
  const desired = {
    connection_limit: '1',
    pool_timeout: '10',
    connect_timeout: '10',
    sslmode: 'require',
  }

  let working = url
  for (const [key, value] of Object.entries(desired)) {
    const already = new RegExp(`[?&]${key}=`)
    if (already.test(working)) continue
    working += working.includes('?') ? `&${key}=${value}` : `?${key}=${value}`
  }

  return working
}

/**
 * Create (or reuse) the singleton PrismaClient.
 */
function createPrismaClient() {
  const datasourceUrl = buildDatasourceUrl()

  const client = new PrismaClient({
    // ✅ Prisma 5 API — top-level `datasourceUrl` would be ignored.
    datasources: {
      db: { url: datasourceUrl },
    },
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

// ============================================================
// Query-level retry helper
// ------------------------------------------------------------
// Why: `connectWithRetry()` only runs once at boot. If Render's
// pooled Postgres drops the connection mid-process (idle eviction,
// PgBouncer timeout, etc.), the next query will throw a
// PrismaClientInitializationError and the controller will return
// a 500 until the dyno is restarted.
//
// `withRetry()` is a thin wrapper that:
//   1. Runs the supplied Prisma callback.
//   2. If it fails with a reconnectable error, calls $disconnect(),
//      waits briefly, and tries `$connect()`.
//   3. Retries the original callback once.
//
// In a future pass, controllers can be migrated to call
// `withRetry(() => prisma.user.findMany(...))` instead of
// `prisma.user.findMany(...)` directly. For now it is exported
// and ready to use.
// ============================================================
const QUERY_RETRY_DELAY_MS = 500
const QUERY_RETRY_ATTEMPTS = 2 // 1 initial + 1 retry

export async function withRetry(fn, { label = 'prisma' } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= QUERY_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isReconnectableError(err) || attempt === QUERY_RETRY_ATTEMPTS) {
        throw err
      }
      console.warn(
        `⚠️  [${label}] reconnectable error (attempt ${attempt}/${QUERY_RETRY_ATTEMPTS}): ${err.message}`
      )
      try {
        await prisma.$disconnect()
      } catch (e) {
        // ignore — we're already in a bad state
      }
      // Give the pool a moment, then re-establish.
      await new Promise((r) => setTimeout(r, QUERY_RETRY_DELAY_MS))
      try {
        await prisma.$connect()
        console.log(`🔁 [${label}] reconnected, retrying query...`)
      } catch (e) {
        console.error(`❌ [${label}] reconnect failed: ${e.message}`)
        throw err
      }
    }
  }
  // Unreachable, but keeps the linter happy.
  throw lastErr
}

export default prisma