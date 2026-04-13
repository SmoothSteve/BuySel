import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/property/all][GET] supabase error:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (error) {
    console.error('[api/property/all][GET] error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
