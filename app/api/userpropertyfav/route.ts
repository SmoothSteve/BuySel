export async function GET(request: Request) {
  const response = await fetch(`${process.env.API_BASE_URL}/property`)
  const data = await response.json()
  return Response.json(data)
}

import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('userpropertyfav')
    .insert({
      user_id: body.user_id,
      property_id: body.property_id
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}