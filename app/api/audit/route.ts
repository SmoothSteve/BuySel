import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/audit'), {
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[api/audit][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(backendUrl('/api/audit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[api/audit][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
