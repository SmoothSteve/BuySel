// Configuration for client-side environment variables
// These values are embedded at build time by Next.js

export const config = {
  storage: {
    // Preferred storage URL pattern (Cloudflare R2/public CDN)
    publicBaseUrl: process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL || '',
  },
  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '',
  },
  googleMaps: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API || '',
  },
  vapid: {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // In the browser, keep `/api/*` calls same-origin to avoid CORS issues
  if (typeof window !== 'undefined' && normalizedPath.startsWith('/api')) {
    return normalizedPath
  }

  return `${config.api.baseUrl}${normalizedPath}`
}

// Preferred file URL builder (Supabase-first, then publicBaseUrl fallback)
export function getPublicFileUrl(filename: string): string {
  if (!filename) return ''

  const normalizedFilename = filename.trim()
  const cleanedFilename = normalizedFilename.replace(/^\//, '')
  const looksLikeBareFilename = !cleanedFilename.includes('/')

  // Already absolute URL
  if (/^https?:\/\//i.test(normalizedFilename)) {
    return normalizedFilename
  }

  const { publicBaseUrl } = config.storage
  const isSameOriginPublicBase =
    typeof window !== 'undefined' &&
    publicBaseUrl &&
    new URL(publicBaseUrl, window.location.origin).origin === window.location.origin
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseProfileBucket = process.env.NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET || 'profile-documents'

  if (supabasePublicUrl && looksLikeBareFilename) {
    return `${supabasePublicUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseProfileBucket}/${cleanedFilename}`
  }

  if (publicBaseUrl && !(isSameOriginPublicBase && looksLikeBareFilename)) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${cleanedFilename}`
  }

  console.error('Storage configuration is missing')
  return ''
}

// Backwards-compatible alias to reduce migration churn
export const getAzureBlobUrl = getPublicFileUrl


// Temporary compatibility shim for stale chunks that reference a global helper
if (typeof globalThis !== 'undefined') {
  ;(globalThis as { getPublicFileUrl?: typeof getPublicFileUrl }).getPublicFileUrl = getPublicFileUrl
}
