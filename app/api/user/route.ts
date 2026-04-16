import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-proxy-v5-2026-04-16'

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

function buildForwardHeaders(request: NextRequest, includeContentType = false) {
  const headers = new Headers()

  if (includeContentType) {
    headers.set('Content-Type', 'application/json')
  }

  const authorization = request.headers.get('authorization')
  if (authorization) headers.set('authorization', authorization)

  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)

  const clientPrincipal = request.headers.get('x-ms-client-principal')
  if (clientPrincipal) headers.set('x-ms-client-principal', clientPrincipal)

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor)

  return headers
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(backendUrl('/api/user'), {
      headers: buildForwardHeaders(request),
      cache: 'no-store'
    })
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
      headers: buildForwardHeaders(request, true),
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
