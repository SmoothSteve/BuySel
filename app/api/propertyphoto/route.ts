import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { getSupabaseAdminClient } from '@/lib/supabase'

const PHOTO_TABLE_CANDIDATES = ['propertyphoto', 'propertyphotos'] as const

const isMissingTableError = (error: { code?: string } | null) => error?.code === '42P01'

async function insertPhotoRecord(record: {
  propertyid: number
  photobloburl: string
  title: string
  dte: string
  doc: boolean | null
}) {
  const supabase = getSupabaseAdminClient()

  let lastError: { message?: string } | null = null

  for (const table of PHOTO_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .insert([record])
      .select('*')
      .single()

    if (!error) {
      return { data, error: null }
    }

    if (!isMissingTableError(error)) {
      return { data: null, error }
    }

    lastError = error
  }

  return { data: null, error: lastError }
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const propertyid = Number(body.propertyid)
    const photobloburl = typeof body.photobloburl === 'string' ? body.photobloburl.trim() : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const dte = typeof body.dte === 'string' ? body.dte : new Date().toISOString()
    const doc = typeof body.doc === 'boolean' ? body.doc : null

    if (!Number.isFinite(propertyid) || propertyid <= 0) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 })
    }

    if (!photobloburl) {
      return NextResponse.json({ error: 'Photo blob URL is required' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Photo title is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('seller_email')
      .eq('id', propertyid)
      .maybeSingle()

    if (propertyError) {
      return NextResponse.json({ error: propertyError.message }, { status: 500 })
    }

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && property.seller_email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await insertPhotoRecord({
      propertyid,
      photobloburl,
      title,
      dte,
      doc
    })

    if (error) {
      return NextResponse.json({ error: error.message ?? 'Failed to save photo' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[api/propertyphoto][POST] error:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
