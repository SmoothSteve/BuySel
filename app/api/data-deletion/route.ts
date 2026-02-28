export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = body.user_id || body.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const confirmationCode = `${userId}_${Date.now()}`

    console.log(`Data deletion request received for user: ${userId}`)
    console.log(`Confirmation code: ${confirmationCode}`)

    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/data-deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode
    })
  } catch (error) {
    console.error('Data deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to process data deletion request' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  return NextResponse.json({
    message: 'Data deletion endpoint',
    note: 'POST request required with user_id',
    confirmation_code: code || null
  })
}
