import { NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/property/all'), {
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[api/property/all][GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
