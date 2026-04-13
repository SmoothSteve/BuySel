import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    {
      service: 'BuySel Next API',
      deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      timestampUtc: new Date().toISOString(),
      routes: {
        user: 'user-proxy-v3-2026-04-13',
        audit: 'audit-proxy-v3-2026-04-13',
      },
    },
    { status: 200 },
  )
}
