import { NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export async function GET() {
  try {
    const response = await fetch(backendUrl('/api/property/all'), {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
  } catch (error) {
    console.error('[api/property/all][GET] error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
