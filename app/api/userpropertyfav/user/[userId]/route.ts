import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('userpropertyfav')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
