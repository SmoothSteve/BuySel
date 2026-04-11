// Configuration for client-side environment variables
// These values are embedded at build time by Next.js

export const config = {
  storage: {
    // Preferred storage URL pattern (Cloudflare R2/public CDN)
    publicBaseUrl: process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL || '',

    // Legacy Azure Blob settings kept temporarily for migration compatibility
    azureBlobSasToken: process.env.NEXT_PUBLIC_AZUREBLOB_SASTOKEN || '',
    azureBlobSasUrlBase: process.env.NEXT_PUBLIC_AZUREBLOB_SASURL_BASE || '',
    azureBlobContainer: process.env.NEXT_PUBLIC_AZUREBLOB_CONTAINER || '',
  },
  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://buysel.azurewebsites.net',
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
  return `${config.api.baseUrl}${normalizedPath}`
}

// Preferred file URL builder (Cloudflare-first, Azure fallback)
export function getPublicFileUrl(filename: string): string {
  if (!filename) return ''

  // Already absolute URL
  if (/^https?:\/\//i.test(filename)) {
    return filename
  }

  const { publicBaseUrl, azureBlobSasUrlBase, azureBlobContainer, azureBlobSasToken } = config.storage

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${filename.replace(/^\//, '')}`
  }

  if (azureBlobSasUrlBase && azureBlobContainer && azureBlobSasToken) {
    return `${azureBlobSasUrlBase}/${azureBlobContainer}/${filename}?${azureBlobSasToken}`
  }

  console.error('Storage configuration is missing')
  return ''
}

// Backwards-compatible alias to reduce migration churn
export const getAzureBlobUrl = getPublicFileUrl
