import { NextRequest, NextResponse } from 'next/server'
import { getProfileById } from '@/lib/server/profile-store'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const numericId = Number.parseInt(id, 10)

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const profile = await getProfileById(numericId)
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sessionId = Number.parseInt(String(user.id), 10)
    const isOwnProfile =
      (!Number.isNaN(sessionId) && sessionId === numericId) ||
      profile.email?.toLowerCase() === user.email.toLowerCase()
    if (user.role !== 'admin' && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[api/user/[id]][GET] failed:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
