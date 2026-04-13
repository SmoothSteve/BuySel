import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth/session'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

export async function GET() {
  try {
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
    const user = await requireAuth()
    const body = await request.json()
    const requestEmail = typeof body?.email === 'string' ? body.email.trim() : ''
    const sessionEmail = user.email.trim()

    if (requestEmail && requestEmail.toLowerCase() !== sessionEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = { ...body, email: sessionEmail }
    delete payload.id

    const saved = await upsertProfile(payload)
    await maybeDualWriteToAzure(payload, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const requestEmail = typeof body?.email === 'string' ? body.email.trim() : ''
    const sessionEmail = user.email.trim()

    if (requestEmail && requestEmail.toLowerCase() !== sessionEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = { ...body, email: sessionEmail }
    delete payload.id

    const saved = await upsertProfile(payload)
    await maybeDualWriteToAzure(payload, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
