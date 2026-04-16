import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'audit-proxy-v3-2026-04-13'

function jsonWithVersion(body: unknown) {
  return NextResponse.json(body, {
    status: 200,
    headers: { 'x-buysel-route-version': ROUTE_VERSION },
  })
}

export async function GET() {
  return jsonWithVersion([])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    fetch(backendUrl('/api/audit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    }).catch((error) => {
      console.error('[api/audit][POST] background forward failed:', error)
    })
  } catch (error) {
    console.error('[api/audit][POST] parse failed:', error)
  }

  return jsonWithVersion({ success: true })
}
