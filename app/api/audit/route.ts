import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

async function proxyAudit(requestPath: string, init?: RequestInit) {
  const response = await fetch(backendUrl(requestPath), {
    cache: 'no-store',
    ...init,
  })

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  }

  const text = await response.text()
  return new NextResponse(text, {
    status: response.status,
    headers: { 'content-type': contentType || 'text/plain; charset=utf-8' },
  })
}

export async function GET() {
  try {
    return await proxyAudit('/api/audit')
  } catch (error) {
    console.error('[api/audit][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    return await proxyAudit('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  } catch (error) {
    console.error('[api/audit][POST] error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
