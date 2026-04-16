import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/property/all][GET] supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
    }

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (error) {
    console.error('[api/property/all][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
  }
}
