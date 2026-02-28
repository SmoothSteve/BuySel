export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { FACEBOOK_CONFIG, getRedirectUri } from '@/lib/auth/oauth-config'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    console.error('Facebook OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=facebook_auth_failed', request.url))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `${FACEBOOK_CONFIG.tokenEndpoint}?${new URLSearchParams({
        code,
        client_id: FACEBOOK_CONFIG.clientId,
        client_secret: FACEBOOK_CONFIG.clientSecret,
        redirect_uri: getRedirectUri('facebook'),
      })}`
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch(
      `${FACEBOOK_CONFIG.userInfoEndpoint}?fields=id,name,email,picture&access_token=${tokens.access_token}`
    )

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userResponse.json()

    // Create or update user in database via C# backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture?.data?.url,
        provider: 'facebook',
        providerId: userInfo.id,
      }),
    })

    if (!backendResponse.ok) {
      throw new Error('Failed to create/update user')
    }

    const userData = await backendResponse.json()

    // Create session
    const session = await getSession()
    session.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.picture,
      provider: 'facebook',
      role: userData.role,
    }
    session.isLoggedIn = true
    await session.save()

    // Get callback URL from cookie
    const callbackUrl = request.cookies.get('oauth_callback_url')?.value || '/'

    const response = NextResponse.redirect(new URL(callbackUrl, request.url))
    response.cookies.delete('oauth_callback_url')

    return response
  } catch (error) {
    console.error('Facebook OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=facebook_auth_failed', request.url))
  }
}
