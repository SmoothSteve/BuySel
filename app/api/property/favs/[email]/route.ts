import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_email', params.email)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
