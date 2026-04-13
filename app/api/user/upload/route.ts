import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const email = (formData.get('email') as string | null)?.trim()
    const docType = (formData.get('docType') as string | null)?.trim()

    if (!file || !docType) {
      return NextResponse.json({ error: 'file and docType are required' }, { status: 400 })
    }

    const sessionEmail = user.email.trim()
    if (email && email.toLowerCase() !== sessionEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const bucket = process.env.SUPABASE_PROFILE_BUCKET || 'profile-documents'
    const safeEmail = sessionEmail.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
    const path = `${safeEmail}/${docType}-${Date.now()}${ext}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({
      path,
      publicUrl: data.publicUrl,
    })
  } catch (error) {
    console.error('[api/user/upload][POST] error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
