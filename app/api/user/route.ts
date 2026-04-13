import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-proxy-v3-2026-04-13'

function jsonWithVersion(body: unknown) {
  return NextResponse.json(body, {
    status: 200,
    headers: { 'x-buysel-route-version': ROUTE_VERSION },
  })
}

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/user'), { cache: 'no-store' })
    if (!response.ok) {
      return jsonWithVersion([])
    }

    const data = await response.json().catch(() => [])
    return jsonWithVersion(Array.isArray(data) ? data : [])
  } catch {
    return jsonWithVersion([])
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
    return jsonWithVersion(data)
  } catch {
    return jsonWithVersion({ success: false })
  }
}

export async function POST(request: NextRequest) {
  return forwardWrite('POST', request)
}

export async function PUT(request: NextRequest) {
  return forwardWrite('PUT', request)
}
