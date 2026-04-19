import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { getSupabaseAdminClient } from '@/lib/supabase'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const DEFAULT_BUCKET = 'profile-documents'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

type UploadDocType = 'photo' | 'building' | 'pest' | 'titlesrch'

const safeDocType = (value: string): UploadDocType | null => {
  if (value === 'photo' || value === 'building' || value === 'pest' || value === 'titlesrch') {
    return value
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const propertyId = Number(formData.get('propertyid'))
    const docType = safeDocType(String(formData.get('docType') || '').trim())

    if (!file || !Number.isFinite(propertyId) || propertyId <= 0 || !docType) {
      return NextResponse.json({ error: 'file, propertyid and valid docType are required' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('seller_email')
      .eq('id', propertyId)
      .maybeSingle()

    if (propertyError) {
      return NextResponse.json({ error: propertyError.message }, { status: 500 })
    }

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && normalizeEmail(property.seller_email || '') !== normalizeEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    const safeExt = ext && ext.length <= 10 ? ext : ''
    const path = `properties/${propertyId}/${docType}-${Date.now()}${safeExt}`
    const bucket = process.env.SUPABASE_PROFILE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || DEFAULT_BUCKET

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({
      path,
      publicUrl: publicData.publicUrl,
    })
  } catch (error) {
    console.error('[api/property/upload][POST] error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
