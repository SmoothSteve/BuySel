import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[api/user][GET] error:', error)
    return NextResponse.json({ error: 'Failed to list user profiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const isAdmin = session.user.role === 'admin'
    const ownsProfile = typeof body?.email === 'string' && body.email.toLowerCase() === session.user.email.toLowerCase()
    if (!isAdmin && !ownsProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const isAdmin = session.user.role === 'admin'
    const ownsProfile = typeof body?.email === 'string' && body.email.toLowerCase() === session.user.email.toLowerCase()
    if (!isAdmin && !ownsProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
