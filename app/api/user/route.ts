import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'
const ADMIN_ROLES = new Set(['admin', 'superadmin'])

function isAdminRole(role?: string) {
  return !!role && ADMIN_ROLES.has(role.toLowerCase())
}

async function authorizeProfileWrite(request: NextRequest) {
  const session = await getSession()
  if (!session?.isLoggedIn || !session.user?.email) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }

  const body = await request.json()
  const targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!targetEmail) {
    return {
      response: NextResponse.json({ error: 'email is required' }, { status: 400 }),
    } as const
  }

  const actorEmail = session.user.email.trim().toLowerCase()
  const isSelfWrite = actorEmail === targetEmail
  const isAdmin = isAdminRole(session.user.role)
  if (!isSelfWrite && !isAdmin) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    } as const
  }

  if (!isAdmin) {
    delete body.role
    delete body.idverified
    delete body.ratesnoticeverified
    delete body.titlesearchverified
    delete body.photoverified
  }

  return { body } as const
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
    const authResult = await authorizeProfileWrite(request)
    if ('response' in authResult) {
      return authResult.response
    }

    const saved = await upsertProfile(authResult.body)
    await maybeDualWriteToAzure(authResult.body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authorizeProfileWrite(request)
    if ('response' in authResult) {
      return authResult.response
    }

    const saved = await upsertProfile(authResult.body)
    await maybeDualWriteToAzure(authResult.body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
