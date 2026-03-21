import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seller = searchParams.get('seller')

  let query = supabase.from('properties').select('*')

  if (seller) {
    query = query.eq('seller_email', seller)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      title,
      address,
      price,
      beds,
      baths,
      lat,
      lon,
      seller_email
    } = body

    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          title,
          address,
          price,
          beds,
          baths,
          lat,
          lon,
          seller_email
        }
      ])
      .select()

    if (error) {
      console.error(error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data)

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}