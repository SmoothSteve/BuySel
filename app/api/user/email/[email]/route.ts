import { NextRequest, NextResponse } from 'next/server'
import { getProfileByEmail } from '@/lib/server/profile-store'

export const runtime = 'nodejs'

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
    console.error('[api/user/email][GET] failed:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
