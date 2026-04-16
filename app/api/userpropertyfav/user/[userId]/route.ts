import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('userpropertyfav')
    .select('*')
    .eq('user_id', params.userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
