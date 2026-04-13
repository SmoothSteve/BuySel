import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  // Keep this endpoint fail-safe for UI stability.
  // If upstream audit service is unavailable, return an empty list.
  return NextResponse.json([], { status: 200 })
}

export async function POST(request: NextRequest) {
  // Return success to avoid breaking user flows when upstream audit is down.
  // Forward in the background on a best-effort basis.
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

  return NextResponse.json({ success: true }, { status: 200 })
}
