export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ user: null, isLoggedIn: false })
    }

    return NextResponse.json({
      user: session.user,
      isLoggedIn: session.isLoggedIn,
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json({ user: null, isLoggedIn: false })
  }
}
