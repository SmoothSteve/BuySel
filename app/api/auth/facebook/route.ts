export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { FACEBOOK_CONFIG, getRedirectUri } from '@/lib/auth/oauth-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Store the callback URL in a cookie to use after OAuth redirect
  const response = NextResponse.redirect(
    `${FACEBOOK_CONFIG.authorizationEndpoint}?${new URLSearchParams({
      client_id: FACEBOOK_CONFIG.clientId,
      redirect_uri: getRedirectUri('facebook'),
      scope: FACEBOOK_CONFIG.scope,
      response_type: 'code',
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
