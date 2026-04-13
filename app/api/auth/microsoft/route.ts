export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { MICROSOFT_CONFIG, sanitizeCallbackUrl } from '@/lib/auth/oauth-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'))
  const state = crypto.randomUUID()

  // Get the actual host from headers (Azure Container Apps uses x-forwarded-host)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`
  const redirectUri = `${origin}/api/auth/microsoft/callback`

  console.log('🔵 Microsoft OAuth: Starting authentication')
  console.log('🔵 Host header:', request.headers.get('host'))
  console.log('🔵 X-Forwarded-Host:', request.headers.get('x-forwarded-host'))
  console.log('🔵 X-Forwarded-Proto:', request.headers.get('x-forwarded-proto'))
  console.log('🔵 Origin:', origin)
  console.log('🔵 Redirect URI:', redirectUri)

  // Store the callback URL in a cookie to use after OAuth redirect
  const response = NextResponse.redirect(
    `${MICROSOFT_CONFIG.authorizationEndpoint}?${new URLSearchParams({
      client_id: MICROSOFT_CONFIG.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: MICROSOFT_CONFIG.scope,
      response_mode: 'query',
      state,
    })}`
  )

  response.cookies.set('oauth_callback_url', callbackUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  response.cookies.set('oauth_state_microsoft', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
