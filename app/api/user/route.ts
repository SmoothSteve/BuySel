import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-proxy-v4-2026-04-16'

function withVersionHeaders(headers?: HeadersInit) {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('x-buysel-route-version', ROUTE_VERSION)
  return responseHeaders
}

function jsonWithVersion(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: withVersionHeaders(),
  })
}

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/user'), { cache: 'no-store' })
    if (!response.ok) {
      return jsonWithVersion([], response.status)
    }

    const data = await response.json().catch(() => [])
    return jsonWithVersion(Array.isArray(data) ? data : [])
  } catch {
    return jsonWithVersion([], 502)
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

    const responseContentType = response.headers.get('content-type') || ''
    const isJsonResponse = responseContentType.includes('application/json')

    if (isJsonResponse) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json(data, {
        status: response.status,
        headers: withVersionHeaders(),
      })
    }

    const text = await response.text().catch(() => '')
    return new NextResponse(text, {
      status: response.status,
      headers: withVersionHeaders({ 'content-type': responseContentType || 'text/plain' }),
    })
  } catch {
    return jsonWithVersion({ success: false, error: 'Unable to reach user service' }, 502)
  }
}

export async function POST(request: NextRequest) {
  return forwardWrite('POST', request)
}

export async function PUT(request: NextRequest) {
  return forwardWrite('PUT', request)
}
