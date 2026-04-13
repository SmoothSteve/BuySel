import { NextRequest, NextResponse } from 'next/server'
import { listProfiles, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  try {
    const profiles = await listProfiles()
    return NextResponse.json(profiles)
  } catch (error) {
    console.error('[api/user][GET] supabase error, falling back:', error)

    try {
      const response = await fetch(backendUrl('/api/user'), { cache: 'no-store' })
      if (!response.ok) {
        return NextResponse.json([], { status: 200 })
      }
      const data = await response.json()
      return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
    } catch (fallbackError) {
      console.error('[api/user][GET] fallback error:', fallbackError)
      return NextResponse.json([], { status: 200 })
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  try {
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'POST')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][POST] supabase error, falling back:', error)

    try {
      const response = await fetch(backendUrl('/api/user'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(data, { status: 200 })
    } catch (fallbackError) {
      console.error('[api/user][POST] fallback error:', fallbackError)
      return NextResponse.json({ success: false }, { status: 200 })
    }
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  try {
    const saved = await upsertProfile(body)
    await maybeDualWriteToAzure(body, 'PUT')
    return NextResponse.json(saved)
  } catch (error) {
    console.error('[api/user][PUT] supabase error, falling back:', error)

    try {
      const response = await fetch(backendUrl('/api/user'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(data, { status: 200 })
    } catch (fallbackError) {
      console.error('[api/user][PUT] fallback error:', fallbackError)
      return NextResponse.json({ success: false }, { status: 200 })
    }
  }
}
