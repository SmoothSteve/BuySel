import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-proxy-v4-2026-04-16'
const NO_BODY_STATUS_CODES = new Set([204, 205, 304])

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

function isNoBodyStatus(status: number) {
  return NO_BODY_STATUS_CODES.has(status)
}

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/user'), {
      headers: buildForwardHeaders(request),
      cache: 'no-store'
    })
    if (!response.ok) {
      return jsonWithVersion([], response.status)
    }

    const legacyResponse = await fetch(legacyUrl, { cache: 'no-store' })

if (!legacyResponse.ok) return null

const data = await legacyResponse.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch {
    return jsonWithVersion([], 502)
  }

  return { profile: body as Record<string, unknown> }
}

async function handleUpsert(method: 'POST' | 'PUT', request: NextRequest) {
  const parsed = await parseProfileRequest(request)
  if ('error' in parsed) {
    return parsed.error
  }

  try {
    const response = await fetch(backendUrl('/api/user'), {
      method,
      headers: buildForwardHeaders(request, true),
      body: bodyText || '{}',
      cache: 'no-store',
    })

    const responseContentType = response.headers.get('content-type') || ''
    const isJsonResponse = responseContentType.includes('application/json')

    if (isNoBodyStatus(response.status)) {
      return new NextResponse(null, {
        status: response.status,
        headers: withVersionHeaders(),
      })
    }

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
  return handleUpsert('POST', request)
}

export async function PUT(request: NextRequest) {
  return handleUpsert('PUT', request)
}
