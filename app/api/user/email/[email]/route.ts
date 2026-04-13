import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email: encodedEmail } = await params
    const email = decodeURIComponent(encodedEmail)
    const response = await fetch(backendUrl(`/api/user/email/${encodeURIComponent(email)}`), { cache: 'no-store' })

    if (!response.ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await response.json().catch(() => null)
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
