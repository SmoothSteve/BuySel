import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth/session'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'
const normalizeEmail = (email: string) => email.trim().toLowerCase()

function canModifyProfile(sessionUser: { email: string; role?: string }, targetEmail?: string) {
  if (!targetEmail) return false
  return sessionUser.role === 'admin' || normalizeEmail(sessionUser.email) === normalizeEmail(targetEmail)
}

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
    if (!canModifyProfile(user, body?.email)) {
      return NextResponse.json({ error: 'Forbidden to modify this profile' }, { status: 403 })
    }
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[api/user][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    if (!canModifyProfile(user, body?.email)) {
      return NextResponse.json({ error: 'Forbidden to modify this profile' }, { status: 403 })
    }
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[api/user][PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
