import { NextRequest, NextResponse } from 'next/server'
import { backendUrl } from '@/lib/server-config'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numericId = Number.parseInt(id, 10)

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const response = await fetch(backendUrl(`/api/user/${numericId}`), { cache: 'no-store' })

    if (!response.ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await response.json().catch(() => null)
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
