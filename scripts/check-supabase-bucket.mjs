#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

function getArg(name, fallback = null) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : fallback
}

function getFlag(name) {
  return process.argv.includes(`--${name}`)
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY environment variables.')
  process.exit(1)
}

const bucket = getArg('bucket', process.env.SUPABASE_PROFILE_BUCKET || 'profile-documents')
const path = getArg('path', '')
const limitArg = Number(getArg('limit', '100'))
const limit = Number.isFinite(limitArg) && limitArg > 0 ? Math.min(limitArg, 1000) : 100
const recursive = getFlag('recursive')
const includeSignedUrls = getFlag('signed-urls')
const signedUrlExpiresInArg = Number(getArg('signed-url-expiry', '3600'))
const signedUrlExpiresIn = Number.isFinite(signedUrlExpiresInArg) && signedUrlExpiresInArg > 0
  ? signedUrlExpiresInArg
  : 3600

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function listAll(folder) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  })

  if (error) {
    throw new Error(`Failed to list bucket "${bucket}" at path "${folder}": ${error.message}`)
  }

  const files = []

  for (const item of data || []) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name
    const isFolder = item.id === null

    files.push({
      path: fullPath,
      name: item.name,
      isFolder,
      metadata: item.metadata,
      updatedAt: item.updated_at
    })

    if (recursive && isFolder) {
      const nested = await listAll(fullPath)
      files.push(...nested)
    }
  }

  return files
}

async function main() {
  const files = await listAll(path)

  if (!files.length) {
    console.log(JSON.stringify({ bucket, path, count: 0, files: [] }, null, 2))
    return
  }

  if (!includeSignedUrls) {
    console.log(JSON.stringify({ bucket, path, count: files.length, files }, null, 2))
    return
  }

  const objects = files.filter((file) => !file.isFolder).map((file) => file.path)

  if (!objects.length) {
    console.log(JSON.stringify({ bucket, path, count: files.length, files, signedUrls: [] }, null, 2))
    return
  }

  const { data: signedUrls, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(objects, signedUrlExpiresIn)

  if (error) {
    throw new Error(`Failed to create signed URLs: ${error.message}`)
  }

  const signedUrlMap = new Map((signedUrls || []).map((item) => [item.path, item.signedUrl]))

  const filesWithUrls = files.map((file) => {
    if (file.isFolder) return file

    return {
      ...file,
      signedUrl: signedUrlMap.get(file.path) || null
    }
  })

  console.log(JSON.stringify({
    bucket,
    path,
    recursive,
    count: filesWithUrls.length,
    signedUrlExpiresIn,
    files: filesWithUrls
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
