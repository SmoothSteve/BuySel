import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/audit'), { cache: 'no-store' })

    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
  } catch (error) {
    console.error('[api/audit][GET] error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const response = await fetch(backendUrl('/api/audit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: 200 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[api/audit][POST] error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
