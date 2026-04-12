import { NextRequest, NextResponse } from 'next/server'
import { getProfileByEmail } from '@/lib/server/profile-store'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email: encodedEmail } = await params
    const email = decodeURIComponent(encodedEmail)

    const profile = await getProfileByEmail(email)

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[api/user/email][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}
