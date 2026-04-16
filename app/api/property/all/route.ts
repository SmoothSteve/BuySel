import { NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/property/all'), {
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => [])
      return NextResponse.json(data, { status: response.status })
    }

    const text = await response.text().catch(() => '')
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType || 'text/plain' },
    })
  } catch (error) {
    console.error('[api/property/all][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
  }
}
