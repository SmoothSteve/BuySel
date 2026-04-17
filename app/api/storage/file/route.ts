import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getSupabaseAdminClient } from '@/lib/supabase'

const DEFAULT_BUCKET = 'profile-documents'
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawPath = request.nextUrl.searchParams.get('path')?.trim()
    if (!rawPath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    // Accept either "folder/file.ext" or "bucket/folder/file.ext".
    const cleanedPath = rawPath.replace(/^\/+/, '')
    const bucket = process.env.SUPABASE_PROFILE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || DEFAULT_BUCKET
    const normalizedPath = cleanedPath.startsWith(`${bucket}/`)
      ? cleanedPath.slice(bucket.length + 1)
      : cleanedPath

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, SIGNED_URL_EXPIRY_SECONDS)

    if (error || !data?.signedUrl) {
      const publicData = supabase.storage.from(bucket).getPublicUrl(normalizedPath)
      if (!publicData?.data?.publicUrl) {
        return NextResponse.json({ error: error?.message || 'File not found' }, { status: 404 })
      }
      return NextResponse.redirect(publicData.data.publicUrl, { status: 307 })
    }

    return NextResponse.redirect(data.signedUrl, { status: 307 })
  } catch (error) {
    console.error('[api/storage/file][GET] error:', error)
    return NextResponse.json({ error: 'Failed to resolve file URL' }, { status: 500 })
  }
}
