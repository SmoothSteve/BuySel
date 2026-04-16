import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, maybeDualWriteToAzure, upsertProfile } from '@/lib/server/profile-store'

export const runtime = 'nodejs'
const ROUTE_VERSION = 'user-supabase-v1-2026-04-16'

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
    const profiles = await getAllProfiles()
    return jsonWithVersion(profiles)
  } catch (error) {
    console.error('[api/user][GET] failed:', error)
    return jsonWithVersion([], 500)
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
    return jsonWithVersion({ error: 'Failed to save user profile' }, 500)
  }
}

export async function POST(request: NextRequest) {
  return handleUpsert('POST', request)
}

export async function PUT(request: NextRequest) {
  return handleUpsert('PUT', request)
}
