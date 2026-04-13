export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scope: 'openid email profile',
}

export const MICROSOFT_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  authorizationEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
  userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
  scope: 'openid email profile User.Read',
}

export const FACEBOOK_CONFIG = {
  clientId: process.env.FACEBOOK_CLIENT_ID!,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  userInfoEndpoint: 'https://graph.facebook.com/v18.0/me',
  scope: 'email public_profile',
}

export function getRedirectUri(provider: string) {
  // Use NEXTAUTH_URL for backward compatibility, or construct from request headers
  const baseUrl = process.env.NEXTAUTH_URL ||
                  process.env.NEXT_PUBLIC_APP_URL ||
                  'http://localhost:3000'
  return `${baseUrl}/api/auth/${provider}/callback`
}

export function sanitizeCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl) return '/'

  // Only allow same-site relative paths
  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/'
  }

  return callbackUrl
}
