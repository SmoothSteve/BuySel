import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_email', email)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
