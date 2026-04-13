import { NextRequest, NextResponse } from 'next/server'
import { getProfileByEmail } from '@/lib/server/profile-store'
import { backendUrl } from '@/lib/server-config'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email: encodedEmail } = await params
    const email = decodeURIComponent(encodedEmail)

    try {
      const profile = await getProfileByEmail(email)

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json(profile)
    } catch (supabaseError) {
      console.error('[api/user/email][GET] supabase error, falling back:', supabaseError)
      const response = await fetch(backendUrl(`/api/user/email/${encodeURIComponent(email)}`), { cache: 'no-store' })
      if (!response.ok) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('[api/user/email][GET] error:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
