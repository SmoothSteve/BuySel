import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth/session'

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
    const session = await getSession()
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (session.user.role !== 'admin' && seller_email !== session.user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

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
