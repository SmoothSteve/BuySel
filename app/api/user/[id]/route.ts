import { NextRequest, NextResponse } from 'next/server'
import { getProfileById } from '@/lib/server/profile-store'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numericId = Number.parseInt(id, 10)

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const profile = await getProfileById(numericId)
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[api/user/[id]][GET] failed:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
