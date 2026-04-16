export async function GET(_request: Request) {
  const response = await fetch(`${process.env.API_BASE_URL}/property`)
  const data = await response.json()
  return Response.json(data)
}

import { getSupabaseAdminClient } from '@/lib/supabase'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('userpropertyfav')
    .delete()
    .eq('id', params.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
