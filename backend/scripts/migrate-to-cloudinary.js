/**
 * One-time migration script: upload all locally stored files to Cloudinary
 * and update the database records with new Cloudinary URLs.
 *
 * Usage:
 *   node scripts/migrate-to-cloudinary.js
 *
 * Requires:
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 *   - DATABASE_URL in .env
 */
import { prisma } from '../src/lib/prisma.js'
import cloudinary from '../src/config/cloudinary.config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log('🔄 Starting migration to Cloudinary...\n')

  // Get all files with local paths
  const files = await prisma.file.findMany({
    where: {
      filePath: {
        startsWith: '/'
      }
    }
  })

  if (files.length === 0) {
    console.log('✅ No local files found to migrate.')
    return
  }

  console.log(`📁 Found ${files.length} file(s) to migrate.\n`)

  let successCount = 0
  let failCount = 0

  for (const file of files) {
    try {
      // Check if local file exists
      if (!fs.existsSync(file.filePath)) {
        console.warn(`⚠️  File not found on disk: ${file.filePath} (ID: ${file.id}) — skipping`)
        failCount++
        continue
      }

      console.log(`  Uploading: ${file.originalName} (${file.fileSize ? Math.round(file.fileSize / 1024) + 'KB' : 'unknown'})...`)

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.filePath, {
        folder: 'tutorspace/files',
        resource_type: 'auto',
        public_id: path.parse(file.filename).name
      })

      // Update database record with Cloudinary URL
      await prisma.file.update({
        where: { id: file.id },
        data: { filePath: result.secure_url }
      })

      console.log(`  ✅ Updated file ID ${file.id} → ${result.secure_url}`)
      successCount++

    } catch (error) {
      console.error(`  ❌ Failed to migrate file ID ${file.id} (${file.originalName}): ${error.message}`)
      failCount++
    }
  }

  console.log(`\n📊 Migration complete: ${successCount} succeeded, ${failCount} failed.`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())