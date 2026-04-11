import { NextRequest, NextResponse } from 'next/server'
import { maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
