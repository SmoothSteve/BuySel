#!/usr/bin/env node
import fs from 'node:fs/promises'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)

const source = args.source || 'api' // api | file
const filePath = args.file
const table = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'
const azureBaseUrl = process.env.AZURE_BACKEND_API_URL || 'https://buysel.azurewebsites.net'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function loadUsers() {
  if (source === 'file') {
    if (!filePath) {
      throw new Error('When --source=file, provide --file=/path/to/users.json')
    }
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  }

  // Expected Azure list endpoint. If your backend uses a different route,
  // export JSON first and run with --source=file.
  const resp = await fetch(`${azureBaseUrl}/api/user`)
  if (!resp.ok) {
    throw new Error(`Failed to load Azure users from ${azureBaseUrl}/api/user (${resp.status})`)
  }

  return resp.json()
}

function mapUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstname: u.firstname ?? null,
    lastname: u.lastname ?? null,
    middlename: u.middlename ?? null,
    dateofbirth: u.dateofbirth ?? null,
    mobile: u.mobile ?? null,
    address: u.address ?? null,
    residencystatus: u.residencystatus ?? null,
    maritalstatus: u.maritalstatus ?? null,
    powerofattorney: u.powerofattorney ?? null,
    idtype: u.idtype ?? 'none',
    idbloburl: u.idbloburl ?? null,
    idverified: u.idverified ?? null,
    termsconditions: u.termsconditions ?? false,
    privacypolicy: u.privacypolicy ?? false,
    dte: u.dte ?? new Date().toISOString(),
    ratesnotice: u.ratesnotice ?? null,
    titlesearch: u.titlesearch ?? null,
    ratesnoticeverified: u.ratesnoticeverified ?? null,
    titlesearchverified: u.titlesearchverified ?? null,
    photoazurebloburl: u.photoazurebloburl ?? null,
    photoverified: u.photoverified ?? null,
    role: u.role ?? 'user',
  }
}

async function main() {
  const users = await loadUsers()
  if (!Array.isArray(users)) {
    throw new Error('Expected an array of users from source')
  }

  console.log(`Loaded ${users.length} users from ${source}`)

  const chunkSize = 200
  for (let i = 0; i < users.length; i += chunkSize) {
    const chunk = users.slice(i, i + chunkSize).map(mapUser)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'email' })
    if (error) {
      throw new Error(`Upsert failed for chunk starting at ${i}: ${error.message}`)
    }
    console.log(`Upserted ${Math.min(i + chunk.length, users.length)}/${users.length}`)
  }

  console.log('Migration complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
