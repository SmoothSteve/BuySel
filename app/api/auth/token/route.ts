export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { signJWT } from '@/lib/auth/jwt'

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Generate JWT for C# backend
    const token = await signJWT({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      provider: session.user.provider,
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
