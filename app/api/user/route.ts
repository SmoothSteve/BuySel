import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { supabase } from '@/lib/supabase'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

type SessionUser = {
  email: string
  role?: string
}

async function requireSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session?.isLoggedIn || !session.user?.email) {
    return null
  }
  return {
    email: session.user.email,
    role: session.user.role,
  }
}

function isAdmin(user: SessionUser): boolean {
  return user.role === 'admin'
}

export async function GET() {
  try {
    const user = await requireSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase.from(TABLE).select('*').order('id', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('[api/user][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!isAdmin(user) && body.email && body.email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = {
      ...body,
      email: isAdmin(user) ? (body.email ?? user.email) : user.email,
      role: isAdmin(user) ? body.role : undefined,
      id: isAdmin(user) ? body.id : undefined,
    }

    const saved = await upsertProfile(payload)
    await maybeDualWriteToAzure(payload, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!isAdmin(user) && body.email && body.email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = {
      ...body,
      email: isAdmin(user) ? (body.email ?? user.email) : user.email,
      role: isAdmin(user) ? body.role : undefined,
      id: isAdmin(user) ? body.id : undefined,
    }

    const saved = await upsertProfile(payload)
    await maybeDualWriteToAzure(payload, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
