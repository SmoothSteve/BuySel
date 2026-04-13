import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth/session'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

async function getAuthorizedSession() {
  const session = await getSession()

  if (!session.isLoggedIn || !session.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { session }
}

function isAdmin(role?: string) {
  return role === 'admin'
}

function canMutateProfile(sessionEmail: string, sessionRole: string | undefined, profileEmail: unknown) {
  if (isAdmin(sessionRole)) {
    return true
  }

  return typeof profileEmail === 'string' && profileEmail.toLowerCase() === sessionEmail.toLowerCase()
}

export async function GET() {
  const auth = await getAuthorizedSession()
  if ('error' in auth) {
    return auth.error
  }

  if (!isAdmin(auth.session.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
  const auth = await getAuthorizedSession()
  if ('error' in auth) {
    return auth.error
  }

  try {
    const body = await request.json()

    if (!canMutateProfile(auth.session.user.email, auth.session.user.role, body?.email)) {
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
  const auth = await getAuthorizedSession()
  if ('error' in auth) {
    return auth.error
  }

  try {
    const body = await request.json()

    if (!canMutateProfile(auth.session.user.email, auth.session.user.role, body?.email)) {
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
