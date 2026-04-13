export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function POST() {
  try {
    const session = await getSession()
    session.destroy()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
