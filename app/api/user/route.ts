import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/user'), { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }
    const data = await response.json().catch(() => [])
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

async function forwardWrite(method: 'POST' | 'PUT', request: NextRequest) {
  const bodyText = await request.text().catch(() => '{}')

  try {
    const response = await fetch(backendUrl('/api/user'), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: bodyText || '{}',
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: 200 })
  } catch {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  return forwardWrite('POST', request)
}

export async function PUT(request: NextRequest) {
  return forwardWrite('PUT', request)
}
