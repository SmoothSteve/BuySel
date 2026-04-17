export async function GET(_request: Request) {
  const response = await fetch(`${process.env.API_BASE_URL}/property`)
  const data = await response.json()
  return Response.json(data)
}

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('userpropertyfav')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
