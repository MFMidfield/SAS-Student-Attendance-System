import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env file if it exists (for node environment)
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let value = match[2] || ''
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        }
        process.env[key] = value.trim()
      }
    })
  }
} catch (err) {
  console.warn('Could not load .env file:', err.message)
}

const cloud = createClient(
  process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY
)

const local = createClient(
  'http://127.0.0.1:54321',
  process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

async function migrateBuckets() {
  const { data: buckets, error } = await cloud.storage.listBuckets()
  if (error) throw error

  console.log(`Found ${buckets.length} buckets`)

  for (const bucket of buckets) {
    const { error: createError } = await local.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types
    })

    if (createError) {
      console.log(`⚠️  ${bucket.name}: ${createError.message}`)
    } else {
      console.log(`✅ Created bucket: ${bucket.name}`)
    }
  }
}

migrateBuckets()

// run node migrate-buckets.mjs