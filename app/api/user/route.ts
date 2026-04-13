import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DualWriteError, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { getSession } from '@/lib/auth/session'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (session.user.role !== 'admin' && body.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    if (error instanceof DualWriteError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (session.user.role !== 'admin' && body.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    if (error instanceof DualWriteError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
