import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])

function getNormalizedEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function isAdminRole(role: unknown) {
  return typeof role === 'string' && role.toLowerCase() === 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.isLoggedIn || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const email = (formData.get('email') as string | null)?.trim()
    const docType = (formData.get('docType') as string | null)?.trim()

    if (!file || !email || !docType) {
      return NextResponse.json({ error: 'file, email and docType are required' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const sessionEmail = getNormalizedEmail(session.user.email)
    const targetEmail = getNormalizedEmail(email)
    if (!isAdminRole(session.user.role) && targetEmail !== sessionEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bucket = process.env.SUPABASE_PROFILE_BUCKET || 'profile-documents'
    const safeEmail = email.replace(/[^a-zA-Z0-9.-]/g, '_')
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
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
