import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase'

const PHOTO_TABLE_CANDIDATES = ['propertyphoto', 'propertyphotos'] as const

const isMissingTableError = (error: { code?: string } | null) => error?.code === '42P01'

async function fetchPropertyPhotos(propertyId: number) {
  const supabase = getSupabaseAdminClient()
  let lastError: { message?: string } | null = null

  for (const table of PHOTO_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('propertyid', propertyId)
      .order('dte', { ascending: false })

    if (!error) {
      return { data: data ?? [], error: null }
    }

    if (!isMissingTableError(error)) {
      return { data: [], error }
    }

    lastError = error
  }

  return { data: [], error: lastError }
}

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const propertyId = Number(id)

  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return NextResponse.json({ error: 'Invalid property id' }, { status: 400 })
  }

  const { data, error } = await fetchPropertyPhotos(propertyId)

  if (error) {
    console.error('[api/propertyphoto/[id]][GET] error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to fetch photos' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}
