import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('query')
  const beds = searchParams.get('beds')
  const baths = searchParams.get('baths')

  let db = supabase.from('properties').select('*')

  if (query && query !== '~') {
    db = db.ilike('address', `%${query}%`)
  }

  if (beds && beds !== '0') {
    db = db.gte('beds', Number(beds))
  }

  if (baths && baths !== '0') {
    db = db.gte('baths', Number(baths))
  }

  const { data, error } = await db

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
