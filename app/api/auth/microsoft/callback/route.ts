export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { MICROSOFT_CONFIG } from '@/lib/auth/oauth-config'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Get the actual host from headers
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`

  if (error || !code) {
    console.error('Microsoft OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL('/?error=microsoft_auth_failed', origin))
  }

  try {
    console.log('🔵 Microsoft OAuth: Exchanging code for tokens')

    // Construct redirect URI from origin (must match what we sent to Microsoft)
    const redirectUri = `${origin}/api/auth/microsoft/callback`

    console.log('🔵 Callback - Host header:', request.headers.get('host'))
    console.log('🔵 Callback - Redirect URI:', redirectUri)

    // Exchange code for tokens
    const tokenResponse = await fetch(MICROSOFT_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CONFIG.clientId,
        client_secret: MICROSOFT_CONFIG.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: MICROSOFT_CONFIG.scope,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Microsoft token exchange failed:', tokenResponse.status, errorData)
      throw new Error(`Failed to exchange code for tokens: ${errorData}`)
    }

    const tokens = await tokenResponse.json()

    // Get user info from Microsoft Graph
    const userResponse = await fetch(MICROSOFT_CONFIG.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

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
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        picture: null, // Microsoft Graph doesn't provide picture in basic profile
        provider: 'microsoft',
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
      provider: 'microsoft',
      role: userData.role,
    }
    session.isLoggedIn = true
    await session.save()

    // Get callback URL from cookie
    const callbackUrl = request.cookies.get('oauth_callback_url')?.value || '/'

    // Construct the full redirect URL using the correct origin
    const redirectUrl = new URL(callbackUrl, origin)

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('oauth_callback_url')

    return response
  } catch (error) {
    console.error('Microsoft OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=microsoft_auth_failed', origin))
  }
}
