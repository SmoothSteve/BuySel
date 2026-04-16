import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-supabase-v2-2026-04-16'

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

function statusForError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase admin configuration') ? 503 : 500
}

async function tryLegacyUserFallback(request: NextRequest) {
  try {
    const legacyUrl = backendUrl('/api/user')
    const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
    const legacyHost = new URL(legacyUrl).host

    // Prevent infinite proxy recursion if BACKEND_API_URL points to this same app host.
    if (legacyHost === requestHost) {
      return null
    }

    const legacyResponse = await fetch(legacyUrl, { cache: 'no-store' })
    if (!legacyResponse.ok) return null

    const data = await legacyResponse.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const profiles = await getAllProfiles()
    return jsonWithVersion(profiles)
  } catch (error) {
    console.error('[api/user][GET] failed:', error)
    const legacyUsers = await tryLegacyUserFallback(request)
    if (legacyUsers) {
      return jsonWithVersion(legacyUsers, 200)
    }
    return jsonWithVersion([], statusForError(error))
  }
}

async function parseProfileRequest(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object' || !('email' in body) || typeof body.email !== 'string' || !body.email.trim()) {
    return { error: jsonWithVersion({ error: 'email is required' }, 400) }
  }

  return { profile: body as Record<string, unknown> }
}

async function handleUpsert(method: 'POST' | 'PUT', request: NextRequest) {
  const parsed = await parseProfileRequest(request)
  if ('error' in parsed) {
    return parsed.error
  }

  try {
    const saved = await upsertProfile(parsed.profile)
    await maybeDualWriteToAzure(parsed.profile, method)
    return jsonWithVersion(saved)
  } catch (error) {
    console.error(`[api/user][${method}] failed:`, error)
    return jsonWithVersion({ error: 'Failed to save user profile' }, statusForError(error))
  }
}

export async function POST(request: NextRequest) {
  return handleUpsert('POST', request)
}

export async function PUT(request: NextRequest) {
  return handleUpsert('PUT', request)
}
