export async function GET(request: Request) {
  const response = await fetch(`${process.env.API_BASE_URL}/property`)
  const data = await response.json()
  return Response.json(data)
}

import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('userpropertyfav')
    .delete()
    .eq('id', params.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}