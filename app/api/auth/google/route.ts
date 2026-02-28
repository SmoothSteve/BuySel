export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { GOOGLE_CONFIG } from '@/lib/auth/oauth-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Get the actual host from headers (Azure Container Apps uses x-forwarded-host)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`
  const redirectUri = `${origin}/api/auth/google/callback`

  // Store the callback URL in a cookie to use after OAuth redirect
  const response = NextResponse.redirect(
    `${GOOGLE_CONFIG.authorizationEndpoint}?${new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_CONFIG.scope,
      access_type: 'offline',
      prompt: 'consent',
    })}`
  )

  response.cookies.set('oauth_callback_url', callbackUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
