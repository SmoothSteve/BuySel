import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { requireAuth } from '@/lib/auth/session'

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

async function parseProfileRequest(request: NextRequest) {
  const rawBody = await request.text()
  const bodyText = rawBody.trim() ? rawBody : '{}'

  try {
    const body = JSON.parse(bodyText) as Record<string, unknown>
    return { body, bodyText }
  } catch {
    return {
      error: jsonWithVersion({ success: false, error: 'Invalid JSON body' }, 400),
    }
  }
}

export async function GET() {
  const startedAt = Date.now()
  try {
    const user = await requireAuth()
    if (user.role !== 'admin') {
      return jsonWithVersion({ success: false, error: 'Forbidden' }, 403)
    }

    const profiles = await getAllProfiles()
    return NextResponse.json(profiles, {
      status: 200,
      headers: withVersionHeaders({
        'x-buysel-query-duration-ms': String(Date.now() - startedAt),
      }),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return jsonWithVersion({ success: false, error: 'Unauthorized' }, 401)
    }
    console.error('[api/user][GET] failed:', error)
    const errorMessage = error instanceof Error ? error.message : ''
    const isTimeout = errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('aborted')

    return jsonWithVersion(
      {
        success: false,
        error: isTimeout
          ? 'User profile query timed out. Check Supabase database performance/indexing.'
          : 'Failed to fetch users',
      },
      isTimeout ? 504 : 502
    )
  }
}

async function handleUpsert(method: 'POST' | 'PUT', request: NextRequest) {
  const parsed = await parseProfileRequest(request)
  if ('error' in parsed) {
    return parsed.error
  }

  const { body } = parsed

  try {
    const user = await requireAuth()
    const requestedEmail = String(body.email || '').trim().toLowerCase()
    const sessionEmail = user.email.trim().toLowerCase()

    if (!requestedEmail) {
      return jsonWithVersion({ success: false, error: 'email is required' }, 400)
    }

    if (user.role !== 'admin' && requestedEmail !== sessionEmail) {
      return jsonWithVersion({ success: false, error: 'Forbidden' }, 403)
    }

    const profile = await upsertProfile(body)

    try {
      await maybeDualWriteToAzure(profile, method)
    } catch (dualWriteError) {
      console.warn(`[api/user][${method}] dual-write warning:`, dualWriteError)
    }

    return NextResponse.json(profile, {
      status: method === 'POST' ? 201 : 200,
      headers: withVersionHeaders(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return jsonWithVersion({ success: false, error: 'Unauthorized' }, 401)
    }
    console.error(`[api/user][${method}] failed:`, error)
    return jsonWithVersion({ success: false, error: 'Unable to save user profile' }, 500)
  }
}

export async function POST(request: NextRequest) {
  return handleUpsert('POST', request)
}

export async function PUT(request: NextRequest) {
  return handleUpsert('PUT', request)
}
