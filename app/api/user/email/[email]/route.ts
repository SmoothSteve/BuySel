import { NextRequest, NextResponse } from 'next/server'
import { getProfileByEmail } from '@/lib/server/profile-store'
import { requireAuth } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const user = await requireAuth()
    const { email: encodedEmail } = await params
    const email = decodeURIComponent(encodedEmail)
    if (user.role !== 'admin' && email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const profile = await getProfileByEmail(email)

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[api/user/email][GET] failed:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
