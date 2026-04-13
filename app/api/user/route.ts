import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { getSession } from '@/lib/auth/session'

const TABLE = process.env.SUPABASE_PROFILE_TABLE || 'user_profiles'

type HttpLikeError = Error & { status?: number; statusCode?: number }

function getErrorStatus(error: unknown, fallback = 500): number {
  const candidate = error as HttpLikeError
  if (typeof candidate?.status === 'number') return candidate.status
  if (typeof candidate?.statusCode === 'number') return candidate.statusCode

  if (candidate?.message?.includes('email is required')) {
    return 400
  }

  const azureStatus = candidate?.message?.match(/Dual-write to Azure failed \((\d{3})\):/)
  if (azureStatus) {
    return Number(azureStatus[1])
  }

  return fallback
}

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

async function writeProfile(request: NextRequest, method: 'POST' | 'PUT') {
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
    await maybeDualWriteToAzure(body, method)
    return NextResponse.json(saved)
  } catch (error) {
    const status = getErrorStatus(error)
    const fallbackMessage = method === 'POST' ? 'Failed to create user profile' : 'Failed to update user profile'
    const message = error instanceof Error ? error.message : fallbackMessage

    console.error(`[api/user][${method}] error:`, error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  return writeProfile(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return writeProfile(request, 'PUT')
}
